import path from 'path';

import jsonwebtoken from 'jsonwebtoken';
import express from 'express';
import exphbs from 'express-handlebars';
import Keycloak from 'keycloak-connect';
import bodyParser from 'body-parser';
import session from 'express-session';

import {fetchData, sendData} from './restCalls';

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

app.use(bodyParser.urlencoded({extended: true}));

app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
}));

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));

function renderUI(request:any, response:any, data:any) {
  response.render('home', {
    host: process.env.LAMBDA_URL,
    hostJwks: process.env.LAMBDA_JWKS_URL,
    ...data,
  });
}

async function clientToRPTExchange(request:any, clientId:any) {
  const token = JSON.parse(request.session['keycloak-token']).access_token;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const res = await fetchData(process.env.LAMBDA_URL, 'GET', {
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

app.post('/lambdaEnt', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const res = await fetchData(process.env.LAMBDA_URL, 'GET', {
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const res = await fetchData(process.env.LAMBDA_JWKS_URL, 'GET', {
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
app.post('/lambdaJwksEnt', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const res = await fetchData(process.env.LAMBDA_JWKS_URL, 'GET', {
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
  renderUI(request, response, '');
});

const server = app.listen(3001, () => {
  const host = 'localhost';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const {port} = server.address();
  // eslint-disable-next-line no-console
  console.log('Example app listening at http://%s:%s', host, port);
});
