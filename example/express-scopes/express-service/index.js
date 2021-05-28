const fs = require('fs');
const express = require('express');
const { middlewareAdapter } = require('keycloak-lambda-authorizer');
const bodyParser = require('body-parser');
const { fetchData, sendData } = require('./restCalls');

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/expressServiceApi1', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'service-api',
        scope: 'scope1',
      },
    },
  },
).middleware,
async (request, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function1 executed successfully!`,
  });
});

app.get('/expressServiceApi2', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'service-api',
        scope: 'scope2',
      },
    },
  },
).middleware,
async (request, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function2 executed successfully!`,
  });
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
