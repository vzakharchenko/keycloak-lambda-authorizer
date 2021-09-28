import fs from 'fs';

import express from 'express';
import KeycloakAdapter from 'keycloak-lambda-authorizer';
import bodyParser from 'body-parser';

import {fetchData} from './restCalls';

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
});

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.get('/service1api1', keycloakAdapter.getExpressMiddlewareAdapter().middleware(
  {
    resource: {
      name: 'Service 1 Resource 1',
    },
  },
),
async (request:any, response) => {
  try {
    const res = await fetchData(`${process.env.SERVICE2_URL}service2Api?message=${request.query.message}->service1`, 'GET', {
      Authorization: `Bearer ${request.jwt.token}`,
    });
    response.json(JSON
      .parse(res));
  } catch (e:any) {
    response.json({message: e.message});
  }
});

app.get('/service1api2', keycloakAdapter.getExpressMiddlewareAdapter().middleware(
  {
    resource: {
      name: 'Service 1 Resource 2',
    },
  },
),
async (request:any, response) => {
  try {
    const res = await fetchData(`${process.env.SERVICE3_URL}service3Api?message=${request.query.message}->service1`, 'GET', {
      Authorization: `Bearer ${request.jwt.token}`,
    });
    response.json(JSON
      .parse(res));
  } catch (e:any) {
    response.json({message: e.message});
  }
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const {port} = server.address();
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', host, port);
});
