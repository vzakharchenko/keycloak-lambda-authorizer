const jwt = require('jsonwebtoken');

const { lambdaAdapter } = require('../adapter/adapter');
const { keycloakRefreshToken } = require('../clientAuthorization');
const { tenantName } = require('../edge/lambdaEdgeUtils');

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

async function getActiveToken(session, accessToken, options, refreshTokenHandler) {
  try {
    await lambdaAdapter(decodeAccessToken(accessToken).accessToken,
      options.keycloakJson,
      options);
    return accessToken;
  } catch (e1) {
    const sessionStorageItem = await options.sessionManager.getSessionIfExists(session, options);
    if (sessionStorageItem) {
      const tn = tenantName(options.keycloakJson(options));
      const externalToken = sessionStorageItem[tn];
      try {
        const token = await keycloakRefreshToken(externalToken, options);
        if (!token) {
          return null;
        }
        if (refreshTokenHandler) {
          refreshTokenHandler(token);
        }
        await options.sessionManager.updateSession(session,
          tn,
          token, options);
        return token.access_token;
      } catch (ex) {
        throw new Error(ex);
      }
    } else {
      options.logger.error(`Session does not exist: ${JSON.stringify(session)}`);
      return null;
    }
  }
}

module.exports = {
  decodeAccessToken,
  tokenIsValid,
  getActiveToken,
};
