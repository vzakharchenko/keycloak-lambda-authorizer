const { adapter, awsAdapter } = require('./src/keycloakAuthorizer');

export async function awsHandler(event, keycloakJson,
  options) {
  const ret = await awsAdapter(event, keycloakJson, options);
  return ret;
}

export async function lambdaAdapter(tokenString, keycloakJson,
  options) {
  const ret = await adapter(tokenString, keycloakJson, options);
  return ret;
}
