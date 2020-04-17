const { unauthorized, internalServerError } = require('./CustomPageUtils');

const defaultCache = require('../cache/NodeCacheImpl');

const defaultEnforcer = {
  enable: false,
  role: '',
  resource: null,
  resources: [],
};

const defaultResource = {
  name: '',
  uri: '',
  owner: '',
  type: '',
  scope: '',
  matchingUri: false,
  deep: false,
  first: -1,
  max: -1,
};


function updateEnforcer(enforcer) {
  const newEnforcer = { ...defaultEnforcer, ...enforcer };
  if (newEnforcer.resource) {
    newEnforcer.resource = { ...defaultResource, ...newEnforcer.resource };
  }
  if (newEnforcer.resources) {
    newEnforcer.resources = newEnforcer.resources.map((res) => ({ ...defaultResource, ...res }));
  }
  return newEnforcer;
}

function commonOptions(options, keycloakJson) {
  return {
    ...{
      keys: options.keys,
      logger: options.logger || console,
      keycloakJson,
      cache: options.cache || defaultCache,
      resources: options.resources,
      enforce: updateEnforcer(options.enforce || defaultEnforcer),
    },
  };
}

function lambdaEdgeOptions(sessionManager) {
  return { sessionManager };
}
function lambdaEdgeRouteOptions(options, keycloakJson) {
  const route = options.route || {};
  return {
    ...commonOptions(options, keycloakJson),
    ...{
      route: {
        unauthorized: route.unauthorized || unauthorized,
        internalServerError: route.unauthorized || internalServerError,

      },
    },
  };
}


module.exports = {
  commonOptions,
  lambdaEdgeOptions,
  lambdaEdgeRouteOptions,
};
