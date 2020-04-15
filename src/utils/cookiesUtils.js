const cookie = require('cookie');

const { tenantName } = require('../edge/lambdaEdgeUtils');

function getCookies(request, responseHeaders = {}) {
  const { headers } = request;
  const newResponseHeaders = { ...responseHeaders };
  if (!newResponseHeaders['set-cookie']) {
    newResponseHeaders['set-cookie'] = [];
  }
  if ('cookie' in headers) {
    const cookieJson = cookie.parse(headers.cookie[0].value);
    Object.keys(cookieJson).filter((field) => field.startsWith('KEYCLOAK_AWS')).forEach((header) => {
      newResponseHeaders['set-cookie'].push({
        key: 'Set-Cookie',
        value: cookie.serialize(header, '', {
          path: '/',
          expires: new Date(2671200000),
        }),
      });
    });
  }
  return newResponseHeaders;
}

function clearCookies(request, options, responseHeaders = {}) {
  const { headers } = request;
  const newResponseHeaders = { ...responseHeaders };
  if (!newResponseHeaders['set-cookie']) {
    newResponseHeaders['set-cookie'] = [];
  }
  if ('cookie' in headers) {
    const cookieJson = cookie.parse(headers.cookie[0].value);
    Object.keys(cookieJson).filter((field) => field.startsWith(`KEYCLOAK_AWS_${tenantName(options.keycloakJson)}`)).forEach((header) => {
      newResponseHeaders['set-cookie'].push({
        key: 'Set-Cookie',
        value: cookie.serialize(header, '', {
          path: '/',
          expires: new Date(2671200000),
        }),
      });
    });
  }
  return newResponseHeaders;
}

function getCookie(request, cookieName = 'KEYCLOAK_AWS_SESSION') {
  const s = `KEYCLOAK_AWS_${cookieName}`;
  const { headers } = request;
  if ('cookie' in headers
        && 'KEYCLOAK_AWS_SESSION' in cookie.parse(headers.cookie[0].value)) {
    const cookieJson = cookie.parse(headers.cookie[0].value);
    return {
      session: cookieJson.KEYCLOAK_AWS_SESSION,
      sessionToken: cookieJson[s],
    };
  }
  return null;
}

module.exports = {
  getCookies,
  getCookie,
  clearCookies,
};
