const defaultCache = require('../cache/NodeCacheImpl');

const defaultEnforcer = {
  enable: false,
  role: '',
  resource: null,
  resourceHandler: () => {},
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
      keycloakJson: typeof keycloakJson === 'function' ? keycloakJson : () => keycloakJson,
      cache: options.cache || defaultCache,
      request: options.request,
      clientId: options.clientId,
      resources: options.resources,
      sessionModify: options.sessionModify,
      sessionDelete: options.sessionDelete,
      responseHandler: options.responseHandler,
      enforce: updateEnforcer(options.enforce || defaultEnforcer),
    },
  };
}

module.exports = {
  commonOptions,
};
