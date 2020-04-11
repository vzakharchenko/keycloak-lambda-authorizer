const jsonwebtoken = require('jsonwebtoken');
const KeyCloakCerts = require('get-keycloak-public-key');
const { getKeycloakUrl } = require('./utils/restCalls');
const { enforce } = require('./umaConfiguration');
const defaultCache = require('./cache/NodeCacheImpl');


const defaultEnforcer = {
  enable: false,
  role: '',
  resource: null,
  resources: [],
};

const defaultResource = {
  name: '',
  uri: '',
  owner: '',
  type: '',
  scope: '',
  matchingUri: false,
  deep: false,
  first: -1,
  max: -1,
};

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

function updateEnforcer(enforcer) {
  const newEnforcer = { ...defaultEnforcer, ...enforcer };
  if (newEnforcer.resource) {
    newEnforcer.resource = { ...defaultResource, ...newEnforcer.resource };
  }
  if (newEnforcer.resources) {
    newEnforcer.resources = newEnforcer.resources.map((res) => ({ ...defaultResource, ...res }));
  }
  return newEnforcer;
}

export async function adapter(tokenString,
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
    resources: options.resources,
    enforce: updateEnforcer(options.enforce || defaultEnforcer),
  };
  const token = decodeToken(tokenString);
  await verifyToken(token, newOptions);
  if (options.enforce && options.enforce.enabled) {
    await enforce(token, newOptions);
  }
  return token;
}


export async function awsAdapter(event,
  keycloakJson,
  options) {
  const tokenString = getTokenString(event);
  const ret = await adapter(tokenString, keycloakJson, options);
  return ret;
}
