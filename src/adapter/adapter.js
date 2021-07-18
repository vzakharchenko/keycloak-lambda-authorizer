const {adapter} = require('../keycloakAuthorizer');
const {jwksUrlResponse} = require('../Jwks');

async function lambdaAdapter(tokenString, keycloakJson,
  options) {
  const ret = await adapter(tokenString, keycloakJson, options);
  return ret;
}

function jwksUrl(publicKey) {
  return jwksUrlResponse(publicKey);
}

module.exports = {
  lambdaAdapter,
  jwksUrl,
};
