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

app.get('/expressServiceApi1', keycloakAdapter.getExpressMiddlewareAdapter().middleware({
  resource: {
    name: 'service-api',
    scope: 'scope1',
  },
}),
async (request:any, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function1 executed successfully!`,
  });
});

app.get('/expressServiceApi2', keycloakAdapter.getExpressMiddlewareAdapter().middleware({
  resource: {
    name: 'service-api',
    scope: 'scope2',
  },
}),
async (request:any, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function2 executed successfully!`,
  });
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  // @ts-ignore
  console.log('Example app listening at http://%s:%s', host, server.address().port);
});
