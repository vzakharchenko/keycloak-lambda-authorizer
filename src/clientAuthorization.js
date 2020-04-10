const { sendData } = require('./utils/restCalls');

let token;


function isExpired() {
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return (clockTimestamp < token.access_token.exp + 30);
}

export async function clientAuthentication(uma2Config, options) {
  if (!token || isExpired(token)) {
    const res = await sendData(`${uma2Config.token_endpoint}`, 'POST',
      `grant_type=client_credentials&client_id=${options.keycloakJson.resource}&client_secret=${options.keycloakJson.credentials.secret}`);
    token = JSON.parse(res);
  }
  return token;
}
