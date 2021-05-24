const fs = require('fs');
const express = require('express');
const { middlewareAdapter } = require('keycloak-lambda-authorizer');
const bodyParser = require('body-parser');
const { fetchData, sendData } = require('./restCalls');

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

function getUrl(url) {
  return url.substr(0, url.indexOf('/realms'));
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/getUserList', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'User List Resource',
      },
    },
  },
).middleware,
async (request, response) => {
  const serviceJWT = await request.serviceAccountJWT();
  const url = `${getUrl(request.jwt.payload.iss)}/admin/realms/admin-rest-api/users`;
  const r = await fetchData(url, 'GET', {
    Authorization: `Bearer ${serviceJWT}`,
  });
  const json = JSON.parse(r);
  const returnObject = json.map((i) => ({
    name: i.username,
    email: i.email,
  }));
  response.json(returnObject);
});

app.get('/getClientList', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'Client  List Resource',
      },
    },
  },
).middleware,
async (request, response) => {
  const serviceJWT = await request.serviceAccountJWT();
  const url = `${getUrl(request.jwt.payload.iss)}/admin/realms/admin-rest-api/clients`;
  const r = await fetchData(url, 'GET', {
    Authorization: `Bearer ${serviceJWT}`,
  });
  const json = JSON.parse(r);
  const returnObject = json.map((i) => ({
    id: i.id,
    name: i.clientId,
  }));
  response.json(returnObject);
});

app.get('/getSecret', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'Client Secret Resource',
      },
    },
  },
).middleware,
async (request, response) => {
  const serviceJWT = await request.serviceAccountJWT();
  const url = `${getUrl(request.jwt.payload.iss)}/admin/realms/admin-rest-api/clients/${request.query.clientId}/client-secret`;
  const r = await fetchData(url, 'GET', {
    Authorization: `Bearer ${serviceJWT}`,
  });
  const json = JSON.parse(r);
  response.json(json);
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
