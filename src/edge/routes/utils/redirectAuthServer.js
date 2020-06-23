const cookie = require('cookie');
const qs = require('querystring');

const { getCookie, clearCookies } = require('../../../utils/cookiesUtils');

const { getActiveToken, decodeAccessToken } = require('../../../utils/TokenUtils');
const { getKeycloakUrl } = require('../../../utils/restCalls');

const { getHostUrl, tenantName, signState } = require('../../lambdaEdgeUtils');

function buildUri(request) {
  const queryDict = qs.parse(request.querystring);
  if (queryDict.redirectUri) {
    return queryDict.redirectUri;
  }
  return request.uri + (request.querystring ? `?${request.querystring}` : '');
}

function updateLoginLink(loginPage, options) {
  if (options.updateLoginPage && options.updateLoginPage instanceof Function) {
    return options.updateLoginPage(loginPage);
  }
  return loginPage;
}

// eslint-disable-next-line import/prefer-default-export
async function redirectToKeycloak(request, options, url, callback) {
  const host = getHostUrl(request);
  const keycloakJson = options.keycloakJson(options);
  options.logger.debug('Redirecting to OIDC provider.');
  const state = url || buildUri(request);
  // if (
  //   !state.includes('#')
  //   || !state.includes('?')
  //   || !state.includes('logout')
  //   || !state.includes('callback')
  // ) {
  //   state = '/';
  // }

  const jwt = await signState(state, options);
  const headers = {
    location: [{
      key: 'Location',
      value: updateLoginLink(
        `${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}/protocol/openid-connect/auth?client_id=${keycloakJson.resource}&redirect_uri=${encodeURIComponent(`${host}/${keycloakJson.realm}/${keycloakJson.resource}/callback`)}&state=${encodeURIComponent(jwt)}&response_type=code&scope=openid${options.kc_idp_hint ? `&kc_idp_hint=${options.kc_idp_hint}` : ''}`,
        options,
      ),
    }],
    'set-cookie': [
      {
        key: 'Set-Cookie',
        value: cookie.serialize('SESSION_TOKEN', '', {
          path: '/',
          expires: new Date(2671200000),
        }),
      },
    ],
  };
  callback(null, {
    status: '302',
    statusDescription: 'Found',
    body: 'Redirecting to OIDC provider',
    headers: clearCookies(request, options, headers),
  });
}

async function responseWithKeycloakRedirectToLoginPage(request, options, url, callback) {
  console.debug('Redirecting to OIDC provider.');
  const state = buildUri(request);
  const jwt = await signState(state, options);
  const host = getHostUrl(request);
  const keycloakJson = options.keycloakJson(options);
  const response = {
    status: '200',
    statusDescription: 'OK',
    body: JSON.stringify({
      location: updateLoginLink(`${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}/protocol/openid-connect/auth?client_id=${keycloakJson.resource}&redirect_uri=${encodeURIComponent(`${host}/${keycloakJson.realm}/${keycloakJson.resource}/callback`)}&state=${encodeURIComponent(jwt)}&response_type=code&scope=openid`,
        options),
    }),
    headers: {
      'set-cookie': [
        {
          key: 'Set-Cookie',
          value: cookie.serialize(`KEYCLOAK_AWS_${tenantName(keycloakJson)}`, '', {
            path: '/',
            expires: new Date(
              1970, 1, 1, 0, 0, 0, 0,
            ),
          }),
        },
      ],
    },
  };
  callback(null, response);
}

async function checkToken(callback, options,
  refreshTokenHandler = () => {}, redirectToKeycloakAction = redirectToKeycloak) {
  const { request } = options;
  const keycloakJson = options.keycloakJson(options);
  const cookieName = tenantName(keycloakJson);
  const cookieHeader = getCookie(request, cookieName);
  if (cookieHeader) {
    const sessionString = cookieHeader.session;
    const sessionTokenString = cookieHeader.sessionToken;
    const decodedSession = sessionString ? decodeAccessToken(sessionString).accessTokenDecode : {};
    if (!await options.sessionManager.checkSession(sessionString)
      || !sessionTokenString
      || !decodedSession.tenants
      || !decodedSession.tenants[keycloakJson.realm]
      || !decodedSession.tenants[keycloakJson.realm][keycloakJson.resource]
    ) {
      await redirectToKeycloakAction(request, options, null, callback);
    } else {
      try {
        const token = await getActiveToken(sessionString, sessionTokenString, options,
          refreshTokenHandler);
        if (!token) {
          await redirectToKeycloakAction(request, options, null, callback);
        } else {
          return {
            access_token: token,
            isChanged: token !== sessionTokenString,
          };
        }
      } catch (e) {
        options.logger.error(`error=${e}`);
        options.route.unauthorized(
          e.message, e, '/', request, callback,
        );
      }
    }
  } else {
    await redirectToKeycloakAction(request, options, null, callback);
  }
  return null;
}

function updateResponseHeaders(token, response, options) {
  if (token.isChanged) {
    const { accessTokenDecode } = decodeAccessToken(token);
    if (!response.headers) {
      response.headers = {};
    }
    const { headers } = response;
    if (!headers['set-cookie']) {
      headers['set-cookie'] = [];
    }
    headers['set-cookie'].push({
      key: 'Set-Cookie',
      value: cookie.serialize(`KEYCLOAK_AWS_${tenantName(options.keycloakJson(options))}`, token.access_token, {
        path: '/',
        expires: new Date((accessTokenDecode.exp - 30) * 1000),
      }),
    });
  }
}

function refreshResponse(token, refreshToken, options) {
  const response = {
    status: '200',
    statusDescription: 'OK',
  };
  if (refreshToken) {
    const refreshTokenDecode = decodeAccessToken(refreshToken).accessTokenDecode;
    const s = tenantName(options.keycloakJson(options));
    response.headers = {
      'set-cookie': [
        {
          key: 'Set-Cookie',
          value: cookie.serialize(`KEYCLOAK_AWS_${s}_EXPIRE`, s, {
            path: '/',
            expires: new Date((refreshTokenDecode.exp) * 1000),
          }),
        },
      ],
    };
  }
  updateResponseHeaders(token, response, options);
  return response;
}

module.exports = {
  redirectToKeycloak,
  responseWithKeycloakRedirectToLoginPage,
  checkToken,
  refreshResponse,
};
