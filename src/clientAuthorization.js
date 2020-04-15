const jsonwebtoken = require('jsonwebtoken');
const jws = require('jws');
const { v4 } = require('uuid');

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
    jti: v4(),
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

async function getTokenByCode(code, host, options) {
  const url = `${getKeycloakUrl(options.keycloakJson)}/realms/${options.keycloakJson.realm}/protocol/openid-connect/token`;
  const authorization = await clientIdAuthorization(options);
  const data = `code=${code}&grant_type=authorization_code&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}&redirect_uri=${encodeURIComponent(`${host}/${options.keycloakJson.realm}/${options.keycloakJson.resource}/callback`)}`;
  const tokenResponse = await sendData(url,
    'POST',
    data,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  const tokenJson = tokenResponse;
  return JSON.parse(tokenJson);
}

async function exchangeRPT(accessToken, clientId, options) {
  const realmName = options.keycloakJson.realm;
  const url = `${getKeycloakUrl(options.keycloakJson)}/realms/${realmName}/protocol/openid-connect/token`;
  const data = `grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience=${clientId}`;
  try {
    const response = await sendData(url,
      'POST',
      data,
      {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      });
    return JSON.parse(response);
  } catch (e) {
    throw new Error(e);
  }
}

async function keycloakRefreshToken(token, options) {
  let tokenJson = token;
  if (!tokenJson) {
    return null;
  }
  const decodedAccessToken = jsonwebtoken.decode(token.access_token);
  const decodedRefreshToken = jsonwebtoken.decode(token.refresh_token);
  if (isExpired(options, decodedRefreshToken)) {
    return null;
  }
  if (!decodedAccessToken || isExpired(options, decodedAccessToken)) {
    const realmName = options.keycloakJson.realm;
    const url = `${getKeycloakUrl(options.keycloakJson)}/realms/${realmName}/protocol/openid-connect/token`;
    options.logger.debug(`Token Request Url: ${url}`);
    const authorization = await clientIdAuthorization(options);
    const data = `refresh_token=${token.refresh_token}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    const tokenResponse = await sendData(url,
      'POST',
      data,
      { 'Content-Type': 'application/x-www-form-urlencoded' });
    tokenJson = JSON.parse(tokenResponse.data);
    if (options.enforce.enabled && !options.enforce.role) {
      tokenJson = await exchangeRPT(tokenJson.access_token,
        options.keycloakJson.resource, options);
    }
  }
  return tokenJson;
}

async function clientAuthentication(uma2Config, options) {
  const key = `${options.keycloakJson.realm}:${options.keycloakJson.resource}`;
  let token = options.cache.get('client_credentials', key);
  if (!token || isExpired(options, token.decodedAccessToken)) {
    const authorization = await clientIdAuthorization(options);
    let data = `grant_type=client_credentials&${authorization}`;
    if (token && !isExpired(options, token.decodedRefreshToken)) {
      data = `refresh_token=${token.refresh_token}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    }
    const res = await sendData(`${uma2Config.token_endpoint}`, 'POST', data);
    token = JSON.parse(res);
    token.decodedAccessToken = jsonwebtoken.decode(token.access_token);
    token.decodedRefreshToken = jsonwebtoken.decode(token.refresh_token);
    options.cache.put('client_credentials', key, token);
  }
  return token;
}

async function logout(refreshToken, options) {
  const authorization = await clientIdAuthorization(options);
  const data = `refresh_token=${refreshToken}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
  const url = `${getKeycloakUrl(options.keycloakJson)}}/realms/${options.keycloakJson.realm}/protocol/openid-connect/logout`;
  await sendData(url,
    'POST',
    data,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
}

module.exports = {
  clientAuthentication,
  keycloakRefreshToken,
  getTokenByCode,
  clientJWT,
  exchangeRPT,
  logout,
};
