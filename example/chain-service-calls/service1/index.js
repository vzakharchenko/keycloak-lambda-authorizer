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

app.get('/service1api1', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'Service 1 Resource 1',
      },
    },
  },
).middleware,
async (request, response) => {
  try {
    const res = await fetchData(`${process.env.SERVICE2_URL}service2Api?message=${request.query.message}->service1`, 'GET', {
      Authorization: `Bearer ${request.jwt.token}`,
    });
    response.json(JSON
      .parse(res));
  } catch (e) {
    response.json({ message: e.message });
  }
});

app.get('/service1api2', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'Service 1 Resource 2',
      },
    },
  },
).middleware,
async (request, response) => {
  try {
    const res = await fetchData(`${process.env.SERVICE3_URL}service3Api?message=${request.query.message}->service1`, 'GET', {
      Authorization: `Bearer ${request.jwt.token}`,
    });
    response.json(JSON
      .parse(res));
  } catch (e) {
    response.json({ message: e.message });
  }
});

const server = app.listen(3002, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
