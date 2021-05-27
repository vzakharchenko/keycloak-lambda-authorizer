const { getRPT } = require('./clientAuthorization');
const { getKeycloakUrl } = require('./utils/restCalls');
const { clientAuthentication } = require('./clientAuthorization');

const { fetchData } = require('./utils/restCalls');

async function getUma2Configuration(options) {
  const keycloakJson = options.keycloakJson(options);
  const { realm } = keycloakJson;
  let uma2Config = await options.cache.get('uma2-configuration', realm);
  if (!uma2Config) {
    const res = await fetchData(`${getKeycloakUrl(keycloakJson)}/realms/${realm}/.well-known/uma2-configuration`);
    uma2Config = JSON.parse(res);
    await options.cache.put('uma2-configuration', realm, JSON.stringify(uma2Config));
  } else {
    uma2Config = JSON.parse(uma2Config);
  }
  return uma2Config;
}

async function getResource(uma2Config,
  options, resourceObject) {
  const { realm, resource } = options.keycloakJson(options);
  const key = `${realm}:${resource}${JSON.stringify(resourceObject)}`;
  let resources = await options.cache.get('resource', key);
  if (!resources) {
    const resourceRegistrationEndpoint = `${uma2Config.resource_registration_endpoint}?name=${resourceObject.name}&uri=${resourceObject.uri}&matchingUri=${!!resourceObject.matchingUri}&owner=${resourceObject.owner}&type=${resourceObject.type}&scope=${resourceObject.scope}&deep=${resourceObject.deep}&first=${resourceObject.first}&max=${resourceObject.max}`;
    const jwt = await clientAuthentication(uma2Config, options);
    const res = await fetchData(resourceRegistrationEndpoint, 'GET', {
      Authorization: `Bearer ${jwt.access_token}`, // client authorizer
    });
    resources = JSON.parse(res);
    await options.cache.put('resource', key, JSON.stringify(resources));
  } else {
    resources = JSON.parse(resources);
  }
  return resources;
}

async function matchResource(uma2Config,
  token,
  options) {
  const permissions = options.enforce.resources || [];
  if (options.enforce.resource) {
    permissions.push(options.enforce.resource);
  }
  let resources = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < permissions.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const resourceJson = await getResource(uma2Config, options, permissions[i]);
    if (options.enforce.resourceHandler) {
      options.enforce.resourceHandler(resourceJson, options);
    }
    resources = resources.concat(resourceJson);
  }
  let { payload } = token;
  if (!payload.authorization) {
    const keycloakJson = await options.keycloakJson();
    const tkn = await getRPT(uma2Config, token, keycloakJson.resource, options);
    payload = tkn.decodedAccessToken;
  }
  let permission;
  const resource = resources.find((resId) => {
    const { authorization } = payload;
    if (authorization && authorization.permissions) {
      permission = authorization.permissions.find((p) => p.rsid === resId);
    }
    return permission;
  });
  const hasScope = !permissions.find((p) => p.scope)
    || permissions.every((p) => permission.scopes.includes(p.scope));
  if (!resource || !hasScope) {
    throw new Error('Access is denied');
  }
}

async function enforce(token, options) {
  if (options.enforce.role) {
    const role = token.payload.realm_access.roles.find(
      (r) => r === options.enforce.role,
    );
    if (!role) {
      throw new Error('Access Denied');
    }
  } else if (options.enforce.clientRole) {
    const { roles } = token.payload.resource_access[options.enforce.clientRole.clientId];
    const role = roles.find(
      (r) => r === options.enforce.clientRole.roleName,
    );
    if (!role) {
      throw new Error('Access Denied');
    }
  } else {
    const uma2Config = await getUma2Configuration(options);
    await matchResource(uma2Config, token, options);
  }
}

module.exports = {
  enforce, matchResource, getResource, getUma2Configuration,
};
