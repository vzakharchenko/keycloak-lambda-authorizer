const { getUrl } = require('../utils/restCalls');

function getHostHeader(request) {
  return request.headers.referer[0].value;
}

function isLocalhost(request) {
  const hostHeaderValue = getHostHeader(request);
  return hostHeaderValue.startsWith('http://localhost');
}

function getHostUrl(request) {
  return getUrl(getHostHeader(request));
}

function updateResponse(request, response) {
  if (response.headers && response.headers['set-cookie']) {
    response.headers['set-cookie'].forEach((hn) => {
      // eslint-disable-next-line no-param-reassign
      hn.value = `${hn.value}${isLocalhost(request) ? '' : `; Domain=${getHostHeader(request)}; Secure`}`;
    });
  }
}

function tenantName(keycloakJson) {
  return `${keycloakJson.realm}-${keycloakJson.resource}`;
}

module.exports = {
  updateResponse,
  getHostUrl,
  tenantName,
  isLocalhost,
};
