const cookie = require('cookie');

const qs = require('querystring');

const { tenantName, getHostUrl } = require('../lambdaEdgeUtils');

const { getKeycloakUrl } = require('../../utils/restCalls');

async function tenantLogout(request, options) {
  const queryDict = qs.parse(request.querystring);
  const keycloakJson = options.keycloakJson(options);
  const tn = tenantName(keycloakJson);

  return {
    status: '302',
    statusDescription: 'Found',
    body: 'Redirect to logout page',
    headers: {
      location: [
        {
          key: 'Location',
          value: `${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}/protocol/openid-connect/logout?redirect_uri=${queryDict.url || `${getHostUrl(request)}/`}`,
        },
      ],
      'set-cookie': [
        {
          key: 'Set-Cookie',
          value: cookie.serialize(`KEYCLOAK_AWS_${tn}`, '', {
            path: '/',
            expires: new Date(2671200000),
          }),
        }, {
          key: 'Set-Cookie',
          value: cookie.serialize(`KEYCLOAK_AWS_${tn}_EXPIRE`, '', {
            path: '/',
            expires: new Date(2671200000),
          }),
        },
      ],
    },
  };
}

module.exports = {
  tenantLogout,
};
