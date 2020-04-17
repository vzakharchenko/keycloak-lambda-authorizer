const qs = require('querystring');
const cookie = require('cookie');
const { getHostUrl, tenantName, validateState } = require('../lambdaEdgeUtils');
const { getTokenByCode, exchangeRPT } = require('../../clientAuthorization');
const { decodeAccessToken } = require('../../utils/TokenUtils');
const { getCookie } = require('../../utils/cookiesUtils');

async function callbackHandler(request, options, callback) {
  const { sessionManager } = options;
  const host = getHostUrl(request);
  const queryDict = qs.parse(request.querystring);

  options.logger.debug('Callback received');
  if (queryDict.error) {
    let error = '';
    let errorDescription = '';
    let errorUri = '';

    if (errors[queryDict.error] != null) {
      // Replace with corresponding value
      error = errors[queryDict.error];
    } else {
      // Replace with passed in value
      error = queryDict.error;
    }

    if (queryDict.error_description != null) {
      errorDescription = queryDict.error_description;
    } else {
      errorDescription = '';
    }

    if (queryDict.error_uri != null) {
      errorUri = queryDict.error_uri;
    } else {
      errorUri = '';
    }

    options.route.unauthorized(
      error, errorDescription, errorUri, request, callback,
    );
    return;
  }
  if (!queryDict.code) {
    options.route.unauthorized(
      'No Code Found', '', '', request, callback,
    );
    return;
  }


  let response;
  try {
    const decodedState = await validateState(queryDict.state, options);
    if (!decodedState) {
      options.logger.error('State validation failed');
      options.route.internalServerError(request, callback);
      return;
    }
    const { code } = queryDict;
    const state = decodedState.s || '/';

    let tokenJson = await getTokenByCode(code, host, options);
    let accessToken = decodeAccessToken(tokenJson);
    if (options.enforce.enabled && !options.enforce.role) {
      tokenJson = await exchangeRPT(accessToken.accessToken,
        options.keycloakJson.resource, options);
      accessToken = decodeAccessToken(tokenJson);
    }
    const { accessTokenDecode } = accessToken;
    const sessionTimeOut = 5 * 60 * 60;

    const { keycloakJson } = options;
    const cookieName = tenantName(keycloakJson);
    const cookies = getCookie(request, cookieName);
    let sessionJWT;
    if (cookies && cookies.session && await sessionManager.checkSession(cookies.session, request)) {
      const decodeSession = decodeAccessToken(cookies.session).accessTokenDecode;
      if (decodeSession.email === accessTokenDecode.email) {
        sessionJWT = await sessionManager.updateSessionToken(cookies.session, options);
      } else {
        await sessionManager.deleteSession(cookies.session);
        sessionJWT = await sessionManager.createSession(host, sessionTimeOut, tokenJson, options);
      }
    } else {
      sessionJWT = await sessionManager.createSession(host, sessionTimeOut, tokenJson, options);
    }
    const sessionJWTDecode = decodeAccessToken(sessionJWT).accessTokenDecode;
    const refreshToken = decodeAccessToken(tokenJson.refresh_token).accessTokenDecode;
    response = {
      status: '302',
      statusDescription: 'Found',
      body: 'ID token retrieved.',
      headers: {
        location: [
          {
            key: 'Location',
            value: state,
          },
        ],
        'set-cookie': [
          {
            key: 'Set-Cookie',
            value: cookie.serialize('KEYCLOAK_AWS_SESSION', sessionJWT, {
              path: '/',
              expires: new Date(sessionJWTDecode.exp * 1000),
            }),
          },
          {
            key: 'Set-Cookie',
            value: cookie.serialize(`KEYCLOAK_AWS_${cookieName}`, accessToken.accessToken, {
              path: '/',
              expires: new Date((accessTokenDecode.exp - 30) * 1000),
            }),
          },
          {
            key: 'Set-Cookie',
            value: cookie.serialize(`KEYCLOAK_AWS_${cookieName}_EXPIRE`, cookieName, {
              path: '/',
              expires: new Date((refreshToken.exp) * 1000),
            }),
          },
        ],
      },
    };
  } catch (e) {
    options.logger.error(`Internal server error: ${e}`);
    options.route.internalServerError(request, callback);
    return;
  }
  if (response) {
    callback(null, response);
  } else {
    options.logger.error('Response is empty');
    options.route.internalServerError(request, callback);
  }
}

module.exports = {
  callbackHandler,
};
