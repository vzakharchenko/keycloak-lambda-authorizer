
function getHostHeader(request) {
  return request.headers.host[0].value;
}

function isLocalhost(request) {
  const hostHeaderValue = getHostHeader(request);
  return hostHeaderValue.startsWith('localhost');
}

function getHostUrl(request) {
  const hostHeaderValue = getHostHeader(request);
  if (hostHeaderValue.startsWith('localhost')) {
    return `http://${hostHeaderValue}`;
  }
  return `https://${hostHeaderValue}`;
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
};
