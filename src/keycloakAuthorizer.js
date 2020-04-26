const jsonwebtoken = require('jsonwebtoken');

const KeyCloakCerts = require('get-keycloak-public-key');
const { getKeycloakUrl } = require('./utils/restCalls');
const { enforce } = require('./umaConfiguration');
const { commonOptions } = require('./utils/optionsUtils');


async function getKeyFromKeycloak(options, kid) {
  let publicKey = await options.cache.get('publicKey', kid);
  if (!publicKey) {
    const keycloakUrl = getKeycloakUrl(options.keycloakJson).replace('/auth', '');
    publicKey = await KeyCloakCerts(keycloakUrl,
      options.keycloakJson.realm).fetch(kid);
    await options.cache.put('publicKey', kid, publicKey);
  }
  return publicKey;
}

function getAuthHeader(event) {
  const { headers } = event;
  return headers ? headers.Authorization : null;
}

function getTokenString(event) {
  const tokenString = event.authorizationToken || getAuthHeader(event);
  if (!tokenString) {
    throw new Error('Expected \'event.authorizationToken\' parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
  }
  return match[1];
}

async function verifyToken(token, options) {
  const { kid } = token.header;
  const { alg } = token.header;
  if (!alg.toLowerCase().startsWith('hs')) {
    // fetch the PEM Public Key
    const key = await getKeyFromKeycloak(options, kid);
    try {
      // Verify and decode the token
      jsonwebtoken.verify(token.tokenString, key);
      options.logger.debug('token verified successfully ');
      return token;
    } catch (error) {
      // Token is not valid
      throw new Error(`invalid token: ${error}`);
    }
  } else {
    throw new Error('invalid token');
  }
}

function decodeToken(tokenString) {
  const token = jsonwebtoken.decode(tokenString, { complete: true });
  if (!token || !token.header) {
    throw new Error('invalid token (header part)');
  } else {
    const { kid } = token.header;
    const { alg } = token.header;
    if (alg.toLowerCase() === 'none' || !kid) {
      throw new Error('invalid token');
    }
    token.tokenString = tokenString;
  }
  return token;
}

async function adapter(tokenString,
  keycloakJson,
  options = {}) {
  if (!keycloakJson) {
    throw new Error('Expected \'keycloakJson\' parameter to be set');
  }
  // const lambdaArn = awsParser(event.methodArn);
  const newOptions = commonOptions(options, keycloakJson);
  const token = decodeToken(tokenString);
  await verifyToken(token, newOptions);
  if (options.enforce && options.enforce.enabled) {
    await enforce(token, newOptions);
  }
  return token;
}


async function awsAdapter(event,
  keycloakJson,
  options) {
  const tokenString = getTokenString(event);
  const ret = await adapter(tokenString, keycloakJson, options);
  return ret;
}

module.exports = {
  awsAdapter, adapter,
};
