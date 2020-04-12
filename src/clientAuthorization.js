const jsonwebtoken = require('jsonwebtoken');
const jws = require('jws');
const uuid = require('uuid/v4');

const { sendData } = require('./utils/restCalls');
const { getKeycloakUrl } = require('./utils/restCalls');

function isExpired(options, token) {
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return clockTimestamp < token.exp - 30;
}
const clientJWT = (payload, option) => new Promise((resolve, reject) => {
  jws.createSign({
    header: { alg: 'RS256', typ: 'RSA' },
    privateKey: option.keys.privateKey,
    payload,
  }).on('done', (signature) => {
    resolve(signature);
  }).on('error', (e) => {
    option.logger.log(`error:${e}`);
    reject(e);
  });
});

function createJWS(options) {
  const timeLocal = new Date().getTime();
  const timeSec = Math.floor(timeLocal / 1000);
  return {
    jti: uuid(),
    sub: options.keycloakJson.resource,
    aud: `${getKeycloakUrl(options.keycloakJson)}/realms/${options.keycloakJson.realm}`,
    exp: timeSec + 30,
    iat: timeSec,
  };
}

async function clientIdAuthorization(options) {
  let authorization = `client_id=${options.keycloakJson.resource}`;
  if (options.keycloakJson.credentials && options.keycloakJson.credentials.secret) {
    const { secret } = options.keycloakJson.credentials;
    if (secret) {
      authorization += `&client_secret=${secret}`;
    }
  } else
  if (options.keys && options.keys.privateKey) {
    authorization += `&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${await clientJWT(createJWS(options), options)}`;
  } else {
    throw new Error('Unsupported Credential Type');
  }
  return authorization;
}

export async function clientAuthentication(uma2Config, options) {
  let token = options.cache.get('client_credentials', options.keycloakJson.resource);
  if (!token || isExpired(options, token.decodedAccessToken)) {
    const authorization = await clientIdAuthorization(options);
    let data = `grant_type=client_credentials&${authorization}`;
    if (token && !isExpired(options, token.decodedRefreshToken)) {
      data = `refresh_token=${token.decodedRefreshToken}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    }
    const res = await sendData(`${uma2Config.token_endpoint}`, 'POST', data);
    token = JSON.parse(res);
    token.decodedAccessToken = jsonwebtoken.decode(token.access_token);
    token.decodedRefreshToken = jsonwebtoken.decode(token.refresh_token);
    options.cache.put('client_credentials', options.keycloakJson.resource, token);
  }
  return token;
}
