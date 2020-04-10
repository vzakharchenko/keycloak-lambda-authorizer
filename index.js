const { adapter } = require('./src/keycloakAuthorizer');

export async function handler(event, keycloakJson,
  options) {
  const ret = await adapter(event, keycloakJson, options);
  return ret;
}
