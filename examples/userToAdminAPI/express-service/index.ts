import fs from 'fs';

import express from 'express';
import KeycloakAdapter from 'keycloak-lambda-authorizer';
import bodyParser from 'body-parser';

import {fetchData} from './restCalls';

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const expressMiddlewareAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
}).getExpressMiddlewareAdapter();

function getUrl(url:string) {
  return url.substr(0, url.indexOf('/realms'));
}

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.get('/getUserList', expressMiddlewareAdapter.middleware(
  {
    resource: {
      name: 'User List Resource',
    },
  },
),
async (request:any, response) => {
  const serviceJWT = await request.serviceAccountJWT();
  const url = `${getUrl(request.jwt.payload.iss)}/admin/realms/admin-rest-api/users`;
  const r = await fetchData(url, 'GET', {
    Authorization: `Bearer ${serviceJWT}`,
  });
  const json = JSON.parse(r);
  const returnObject = json.map((i:any) => ({
    name: i.username,
    email: i.email,
  }));
  response.json(returnObject);
});

app.get('/getClientList', expressMiddlewareAdapter.middleware(
  {
    resource: {
      name: 'Client  List Resource',
    },
  },
),
async (request:any, response) => {
  const serviceJWT = await request.serviceAccountJWT();
  const url = `${getUrl(request.jwt.payload.iss)}/admin/realms/admin-rest-api/clients`;
  const r = await fetchData(url, 'GET', {
    Authorization: `Bearer ${serviceJWT}`,
  });
  const json = JSON.parse(r);
  const returnObject = json.map((i:any) => ({
    id: i.id,
    name: i.clientId,
  }));
  response.json(returnObject);
});

app.get('/getSecret', expressMiddlewareAdapter.middleware(
  {
    resource: {
      name: 'Client Secret Resource',
    },
  },
),
async (request:any, response) => {
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const {port} = server.address();
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', host, port);
});
