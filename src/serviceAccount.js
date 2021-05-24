const { getUma2Configuration } = require('./umaConfiguration');
const { commonOptions } = require('./utils/optionsUtils');
const { clientAuthentication } = require('./clientAuthorization');

async function serviceAccountJWT(keycloakJson, options) {
  let newOptions = options;
  if (keycloakJson) {
    newOptions = commonOptions(options, keycloakJson);
  }
  const serviceAccountToken = await clientAuthentication(
    await getUma2Configuration(newOptions), newOptions,
  );
  return serviceAccountToken.access_token;
}

module.exports = {
  serviceAccountJWT,
};
