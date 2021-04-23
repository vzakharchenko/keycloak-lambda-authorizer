const jsonwebtoken = require('jsonwebtoken');
const express = require('express');
const exphbs = require('express-handlebars');
const Keycloak = require('keycloak-connect');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { fetchData, sendData } = require('./restCalls');

const app = express();
const memoryStore = new session.MemoryStore();
const state = {
  status: '',
  statusJwks: '',
  statusToken: '',
};

app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
}));

const keycloak = new Keycloak({
  store: memoryStore,
});

app.use(keycloak.middleware());

app.use(bodyParser.urlencoded({ extended: true }));

app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
}));

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));

function renderUI(request, response, data) {
  response.render('home', {
    host: process.env.LAMBDA_URL,
    hostJwks: process.env.LAMBDA_JWKS_URL,
    ...data,
  });
}

async function clientToRPTExchange(request, clientId) {
  const token = JSON.parse(request.session['keycloak-token']).access_token;
  const tokenUrl = `${keycloak.config.authServerUrl}/realms/${keycloak.config.realm}/protocol/openid-connect/token`;
  const data = `grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience=${clientId}`;
  try {
    const response = await sendData(tokenUrl,
      'POST',
      data,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      });
    return JSON.parse(response);
  } catch (e) {
    throw new Error(e);
  }
}

app.post('/lambda', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request, response) => {
  const lambdaJWT = await clientToRPTExchange(request, 'lambda');
  try {
    res = await fetchData(process.env.LAMBDA_URL, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      status: JSON
        .parse(res).message,
      statusToken: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      status: e,
      statusToken: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.post('/lambdaEnt', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    res = await fetchData(process.env.LAMBDA_URL, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      statusEnt: JSON
        .parse(res).message,
      statusTokenEnt: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      statusEnt: e,
      statusTokenEnt: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.post('/lambdaJwks', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request, response) => {
  const lambdaJWT = await clientToRPTExchange(request, 'lambda-jwks');
  try {
    res = await fetchData(process.env.LAMBDA_JWKS_URL, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      statusJwks: JSON
        .parse(res).message,
      statusTokenJwks: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      statusJwks: e,
      statusTokenJwks: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});
app.post('/lambdaJwksEnt', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    res = await fetchData(process.env.LAMBDA_JWKS_URL, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      statusJwksEnt: JSON
        .parse(res).message,
      statusTokenJwksEnt: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      statusJwksEnt: e,
      statusTokenJwksEnt: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.get('/', keycloak.protect(), keycloak.enforcer(['uiResource']), (request, response) => {
  renderUI(request, response, '', '');
});

const server = app.listen(3001, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
