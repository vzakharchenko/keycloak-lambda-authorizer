const { jwksUrl } = require('../../adapter/adapter');

const { tenantLogout } = require('./Logout');
const { callbackHandler } = require('./Callback');
const { lambdaEdgeRouteOptions } = require('../../utils/optionsUtils');
const { registerRoute } = require('../router');
const {
  checkToken,
  responseWithKeycloakRedirectToLoginPage,
  refreshResponse,
} = require('./utils/redirectAuthServer');

async function isRequest(request, routePath) {
  const { uri } = request;
  const ret = (routePath instanceof RegExp) ? !!uri.match(routePath)
    : (uri.startsWith(`/${routePath}`)
      || uri.startsWith(routePath));
  return ret;
}

function defaultRegexRoute(url) {
  return new RegExp(`(^)(\\/|)(${url})(/$|(\\?|$))`, 'g');
}

function addRoute(route) {
  registerRoute(route);
  console.log('added route');
}

function addUnProtected(routePath) {
  console.log(`unprotected route ${routePath}`);
  addRoute({
    isRoute: async (request) => await isRequest(request, routePath),
    handle: async (request, config, callback) => {
      callback(null, request);
    },
  });
}
function addJwksEndpoint(routePath, publicKey) {
  console.log(`unprotected jwks endpoint route ${routePath}`);
  addRoute({
    isRoute: async (request) => await isRequest(request, routePath),
    handle: async (request, config, callback) => {
      const response = {
        status: '200',
        body: jwksUrl(publicKey),
      };
      callback(null, response);
    },
  });
}

function addProtected(routePath, keycloakJson, options = {}) {
  let kjson = keycloakJson;
  let kjsonFunction = () => keycloakJson;
  if (!keycloakJson) {
    throw new Error('keycloak.json is empty');
  }
  if (typeof keycloakJson === 'function') {
    kjsonFunction = keycloakJson;
    kjson = { realm: '{?}', resource: '{?}' };
  }

  const newOptions = lambdaEdgeRouteOptions(options, keycloakJson);
  // tenant logout
  console.log(`tenant logout route /${kjson.realm}/kjson.resource}/logout`);
  addRoute({
    isRoute: async (request) => await isRequest(request, defaultRegexRoute(`/${kjsonFunction(request, routePath, newOptions).realm}/${kjsonFunction(request, routePath, newOptions).resource}/logout`)),
    handle: async (request, config, callback, lambdaEdgeOptions) => {
      const newOptions0 = {
        ...newOptions, ...lambdaEdgeOptions, request, routePath,
      };
      const response = await tenantLogout(request, newOptions0);
      if (response) {
        callback(null, response);
      }
    },
  });
  console.log(`tenant callback route /${kjson.realm}/${kjson.resource}/callback`);
  // tenant callback
  addRoute({
    isRoute: async (request) => await isRequest(request, defaultRegexRoute(`/${kjsonFunction(request, routePath, options).realm}/${kjsonFunction(routePath, options).resource}/callback`)),
    handle: async (request, config, callback, lambdaEdgeOptions) => {
      const newOptions0 = {
        ...newOptions, ...lambdaEdgeOptions, request, routePath,
      };
      const response = await callbackHandler(request, newOptions0, callback);
      if (response) {
        callback(null, response);
      }
    },
  });

  console.log(`tenant refresh token route /${kjson.realm}/${kjson.resource}/refresh`);
  // tenant refresh
  addRoute({
    isRoute: async (request) => await isRequest(request, defaultRegexRoute(`/${kjsonFunction(request, routePath, options).realm}/${kjsonFunction(routePath, options).resource}/refresh`)),
    handle: async (request, config, callback, lambdaEdgeOptions) => {
      const newOptions0 = {
        ...newOptions, ...lambdaEdgeOptions, request, routePath,
      };
      let refreshToken = null;
      const token = await checkToken(callback, newOptions0,
        (refreshedToken) => {
          refreshToken = refreshedToken.refresh_token;
        }, responseWithKeycloakRedirectToLoginPage);
      if (token) {
        const response = refreshResponse(token, refreshToken, newOptions0);
        callback(null, response);
      }
    },
  });
  const routes = Array.isArray(routePath) ? routePath : [routePath];
  routes.forEach((route) => {
    console.log(`tenant route ${route}`);
    // tenant protection
    addRoute({
      isRoute: async (request) => await isRequest(request, route),
      handle: async (request, config, callback, lambdaEdgeOptions) => {
        const newOptions0 = {
          ...newOptions, ...lambdaEdgeOptions, request, routePath,
        };
        const token = await checkToken(callback, newOptions0);
        if (token) {
          callback(null, request);
        }
      },
    });
  });
}


module.exports = {
  addRoute,
  addUnProtected,
  addJwksEndpoint,
  addProtected,
  isRequest,
};
