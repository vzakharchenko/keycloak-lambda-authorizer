const jsonwebtoken = require('jsonwebtoken');
const jws = require('jws');
const {v4} = require('uuid');

const {sendData} = require('./utils/restCalls');
const {getKeycloakUrl} = require('./utils/restCalls');

function isExpired(options, token) {
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return clockTimestamp > token.exp - 30;
}
const clientJWT = (payload, option) => new Promise((resolve, reject) => {
  jws.createSign({
    header: {alg: 'RS256', typ: 'RSA'},
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
  const keycloakJson = options.keycloakJson(options);
  return {
    jti: v4(),
    sub: keycloakJson.resource,
    iss: keycloakJson.resource,
    aud: `${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}`,
    exp: timeSec + 30,
    iat: timeSec,
  };
}

async function clientIdAuthorization(options) {
  const keycloakJson = options.keycloakJson(options);
  let authorization = `client_id=${keycloakJson.resource}`;
  if (keycloakJson.credentials && keycloakJson.credentials.secret) {
    const {secret} = keycloakJson.credentials;
    if (secret) {
      authorization += `&client_secret=${secret}`;
    }
  } else
  if (options.keys && options.keys.privateKey) {
    authorization += `&client_assertion=${await clientJWT(createJWS(options), options)}`;
  } else {
    throw new Error('Unsupported Credential Type');
  }
  return authorization;
}

async function getTokenByCode(code, host, options) {
  const keycloakJson = options.keycloakJson(options);
  const url = `${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}/protocol/openid-connect/token`;
  const authorization = await clientIdAuthorization(options);
  const data = `code=${code}&grant_type=authorization_code&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}&redirect_uri=${encodeURIComponent(`${host}/${keycloakJson.realm}/${keycloakJson.resource}/callback`)}`;
  const tokenResponse = await sendData(url,
    'POST',
    data,
    {'Content-Type': 'application/x-www-form-urlencoded'});
  const tokenJson = tokenResponse;
  return JSON.parse(tokenJson);
}

async function exchangeRPT(accessToken, clientId, options) {
  const keycloakJson = options.keycloakJson(options);
  const realmName = keycloakJson.realm;
  const url = `${getKeycloakUrl(keycloakJson)}/realms/${realmName}/protocol/openid-connect/token`;
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
    const keycloakJson = options.keycloakJson(options);
    const realmName = keycloakJson.realm;
    const url = `${getKeycloakUrl(keycloakJson)}/realms/${realmName}/protocol/openid-connect/token`;
    options.logger.debug(`Token Request Url: ${url}`);
    const authorization = await clientIdAuthorization(options);
    const data = `refresh_token=${token.refresh_token}&grant_type=refresh_token&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    try {
      const tokenResponse = await sendData(url,
        'POST',
        data,
        {'Content-Type': 'application/x-www-form-urlencoded'});
      tokenJson = JSON.parse(tokenResponse);
      if (options.enforce.enabled && !options.enforce.role) {
        tokenJson = await exchangeRPT(tokenJson.access_token,
          options.clientId || keycloakJson.resource, options);
      }
    } catch (e) {
      options.logger.error(`wrong refresh token for ${realmName}`, e);
      tokenJson = null;
    }
  }
  return tokenJson;
}

async function clientAuthentication(uma2Config, options) {
  const keycloakJson = options.keycloakJson(options);
  const key = `${keycloakJson.realm}:${keycloakJson.resource}`;
  let token = await options.cache.get('client_credentials', key);
  if (!token || isExpired(options, JSON.parse(token).decodedAccessToken)) {
    const parsedToken = token ? JSON.parse(token) : null;
    const authorization = await clientIdAuthorization(options);
    let data = `grant_type=client_credentials&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    if (parsedToken &&
      parsedToken.decodedRefreshToken &&
      !isExpired(options, parsedToken.decodedRefreshToken)) {
      data = `refresh_token=${JSON.parse(token).refresh_token}&grant_type=refresh_token&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    }
    const res = await sendData(`${uma2Config.token_endpoint}`, 'POST', data);
    token = JSON.parse(res);
    token.decodedAccessToken = jsonwebtoken.decode(token.access_token);
    token.decodedRefreshToken = jsonwebtoken.decode(token.refresh_token);
    await options.cache.put('client_credentials', key, JSON.stringify(token));
  } else {
    token = JSON.parse(token);
  }
  return token;
}
async function getRPT(uma2Config, token, clientId, options) {
  const keycloakJson = await options.keycloakJson(options);
  const key = `${keycloakJson.realm}:${clientId}:${token.payload.jti}`;
  let tkn = await options.cache.get('rpt', key);
  if (!tkn) {
    tkn = await exchangeRPT(token.tokenString, clientId, options);
    tkn.decodedAccessToken = jsonwebtoken.decode(tkn.access_token);
    tkn.decodedRefreshToken = jsonwebtoken.decode(tkn.refresh_token);
    await options.cache.put('rpt', key, JSON.stringify(tkn), tkn.refresh_expires_in);
  } else {
    const parseToken = JSON.parse(tkn);
    if (isExpired(options, parseToken.decodedAccessToken)) {
      if (parseToken.refresh_token) {
        tkn = await keycloakRefreshToken(parseToken, options);
      } else {
        tkn = await exchangeRPT(token.tokenString, clientId, options);
      }
      tkn.decodedAccessToken = jsonwebtoken.decode(tkn.access_token);
      tkn.decodedRefreshToken = jsonwebtoken.decode(tkn.refresh_token);
      await options.cache.put('rpt', key, JSON.stringify(tkn), tkn.refresh_expires_in);
    } else {
      tkn = parseToken;
    }
  }
  return tkn;
}

async function logout(refreshToken, options) {
  const authorization = await clientIdAuthorization(options);
  const data = `refresh_token=${refreshToken}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
  const keycloakJson = options.keycloakJson(options);
  const url = `${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}/protocol/openid-connect/logout`;
  await sendData(url,
    'POST',
    data,
    {'Content-Type': 'application/x-www-form-urlencoded'});
}

module.exports = {
  clientAuthentication,
  keycloakRefreshToken,
  getTokenByCode,
  clientJWT,
  exchangeRPT,
  getRPT,
  logout,
};
