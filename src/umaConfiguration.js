const { getKeycloakUrl } = require('./utils/restCalls');
const { clientAuthentication } = require('./clientAuthorization');

const { fetchData } = require('./utils/restCalls');


async function getUma2Configuration(options) {
  const { realm } = options.keycloakJson;
  let uma2Config = options.cache.get('uma2-configuration', realm);
  if (!uma2Config) {
    const res = await fetchData(`${getKeycloakUrl(options.keycloakJson)}/realms/${realm}/.well-known/uma2-configuration`);
    uma2Config = JSON.parse(res);
    options.cache.put('uma2-configuration', realm, uma2Config);
  }
  return uma2Config;
}

async function getResource(uma2Config,
  options, resource) {
  let resources = options.cache.get('resource', JSON.stringify(resource));
  if (!resources) {
    const resourceRegistrationEndpoint = `${uma2Config.resource_registration_endpoint}?name=${resource.name}&uri=${resource.uri}&matchingUri=${!!resource.matchingUri}&owner=${resource.owner}&type=${resource.type}&scope=${resource.scope}&deep=${resource.deep}&first=${resource.first}&max=${resource.max}`;
    const jwt = await clientAuthentication(uma2Config, options);
    const res = await fetchData(resourceRegistrationEndpoint, 'GET', {
      Authorization: `Bearer ${jwt.access_token}`, // client authorizer
    });
    resources = JSON.parse(res);
    options.cache.put('resource', JSON.stringify(resource), resources);
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
    resources = resources.concat(await getResource(uma2Config, options, permissions[i]));
  }
  const resource = resources.filter((resId) => {
    const { authorization } = token.payload;
    return authorization && authorization.permissions && authorization
      .permissions.find((p) => p.rsid === resId);
  });
  if (!resource || resource.length !== permissions.length) {
    throw new Error('Access is denied');
  }
}

export async function enforce(token, options) {
  if (options.enforce.role) {
    const role = token.payload.realm_access.roles.find(
      (r) => r === options.enforce.role,
    );
    if (!role) {
      throw new Error('Access Denied');
    }
  } else {
    const uma2Config = await getUma2Configuration(options);
    await matchResource(uma2Config, token, options);
  }
}
