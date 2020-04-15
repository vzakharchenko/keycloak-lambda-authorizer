const fetch = require('axios');

async function fetchData(url, method = 'GET', headers) {
  const ret = await fetch({
    url,
    method,
    headers,
    transformResponse: (req) => req,
    withCredentials: true,
    timeout: 29000,
  });
  return ret.data;
}

async function sendData(url, method = 'POST', data, headers) {
  const ret = await fetch({
    url,
    method,
    data,
    transformResponse: (req) => req,
    headers,
    withCredentials: true,
    timeout: 29000,
  });
  return ret.data;
}

function getKeycloakUrl(keycloakJson) {
  const keycloakJsonElement = keycloakJson['auth-server-url'];
  return keycloakJsonElement.slice(keycloakJsonElement.length - 1) === '/'
    ? keycloakJsonElement.slice(0, -1) : keycloakJsonElement;
}

module.exports = {
  fetchData,
  sendData,
  getKeycloakUrl,
};
