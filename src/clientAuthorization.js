const jsonwebtoken = require('jsonwebtoken');
const { sendData } = require('./utils/restCalls');


function isExpired(options, token) {
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return clockTimestamp < token.exp - 30;
}

export async function clientAuthentication(uma2Config, options) {
  let token = options.cache.get('client_credentials', options.keycloakJson.resource);
  if (!token || isExpired(options, token.decodedAccessToken)) {
    const authorization = `client_id=${options.keycloakJson.resource}&client_secret=${options.keycloakJson.credentials.secret}`;
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
