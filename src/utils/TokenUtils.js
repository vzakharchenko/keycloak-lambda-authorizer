const jwt = require('jsonwebtoken');

const {lambdaAdapter} = require('../adapter/adapter');
const {keycloakRefreshToken} = require('../clientAuthorization');

function decodeAccessToken(externalToken) {
  const token = externalToken.access_token ? externalToken.access_token : externalToken;
  return {
    accessTokenDecode: jwt.decode(token),
    accessToken: token,
  };
}

async function tokenIsValid(token, options) {
  try {
    await lambdaAdapter(decodeAccessToken(token).accessToken, options.keycloakJson, options);
    return true;
  } catch (e1) {
    return false;
  }
}

module.exports = {
  decodeAccessToken,
  tokenIsValid,
};
