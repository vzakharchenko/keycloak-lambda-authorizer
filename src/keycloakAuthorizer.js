const jsonwebtoken = require('jsonwebtoken');
const KeyCloakCerts = require('get-keycloak-public-key');
const { getKeycloakUrl } = require('./utils/restCalls');
const { enforce } = require('./umaConfiguration');
const defaultCache = require('./cache/NodeCacheImpl');


async function getKeyFromKeycloak(options, kid) {
  let publicKey = options.cache.get('publicKey', kid);
  if (!publicKey) {
    const keycloakUrl = getKeycloakUrl(options.keycloakJson).replace('/auth', '');
    publicKey = await KeyCloakCerts(keycloakUrl,
      options.keycloakJson.realm).fetch(kid);
    options.cache.put('publicKey', kid, publicKey);
  }
  return publicKey;
}

function getAuthHeader(event) {
  const { headers } = event;
  return headers ? headers.Authorization : null;
}

async function getToken(params) {
  const tokenString = params.authorizationToken || getAuthHeader(params);
  if (!tokenString) {
    throw new Error('Expected \'event.authorizationToken\' parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
  }
  const tokenStringValue = match[1];
  const decodedJwt = jsonwebtoken.decode(tokenStringValue, { complete: true });
  if (!decodedJwt || !decodedJwt.header) {
    throw new Error('invalid token (header part)');
  } else {
    const { kid } = decodedJwt.header;
    const { alg } = decodedJwt.header;
    if (alg.toLowerCase() === 'none' || !kid) {
      throw new Error('invalid token');
    }
    return { tokenString: tokenStringValue, decoded: decodedJwt };
  }
}

async function verifyToken(token, options) {
  const decodedJwt = token.decoded;
  const { kid } = decodedJwt.header;
  const { alg } = decodedJwt.header;
  if (!alg.toLowerCase().startsWith('hs')) {
    // fetch the PEM Public Key
    const key = await getKeyFromKeycloak(options, kid);
    try {
      // Verify and decode the token
      jsonwebtoken.verify(token.tokenString, key);
      options.logger.debug('token verified successfully ');
      return decodedJwt;
    } catch (error) {
      // Token is not valid
      throw new Error(`invalid token: ${error}`);
    }
  } else {
    throw new Error('invalid token');
  }
}

export async function adapter(event,
  keycloakJson,
  options = {}) {
  if (!keycloakJson) {
    throw new Error('Expected \'keycloakJson\' parameter to be set');
  }
  // const lambdaArn = awsParser(event.methodArn);
  const newOptions = {
    logger: options.logger || console,
    keycloakJson,
    cache: options.cache || defaultCache,
    resources: options.resources || [event.methodArn],
    enforce: options.enforce || { enable: true },
  };
  const token = await getToken(event, newOptions);
  await verifyToken(token, newOptions);
  if (options.enforce && options.enforce.enabled) {
    await enforce(token, newOptions);
  }
  return token;
}
