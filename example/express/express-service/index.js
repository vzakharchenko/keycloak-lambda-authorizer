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

app.get('/expressServiceApi', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'service-api',
      },
    },
  },
).middleware,
async (request, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function executed successfully!`,
  });
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
