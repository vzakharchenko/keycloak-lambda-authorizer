import fs from 'fs';
import express from 'express';
import KeycloakAdapter from 'keycloak-lambda-authorizer';
import bodyParser from 'body-parser';

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/expressServiceApi', keycloakAdapter.getExpressMiddlewareAdapter().middleware({
  resource: {
    name: 'service-api',
  },
}),
async (request:any, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function executed successfully!`,
  });
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  // @ts-ignore
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
