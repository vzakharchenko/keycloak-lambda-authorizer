const express = require('express');
const exphbs = require('express-handlebars');
const Keycloak = require('keycloak-connect');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { fetchData, sendData } = require('./restCalls');

const app = express();
const memoryStore = new session.MemoryStore();
const state ={
  status:'',
  status_jwks:''
}

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

function renderUI(request, response, status,status_jwks) {
  state.status = status;
  state.status_jwks = status_jwks;
  response.render('home', {
    status, host: process.env.LAMBDA_URL,
    status_jwks, host_jwks: process.env.LAMBDA_JWKS_URL,
  });
}

async function clientToRPTExchange(request, clientId) {
  const token = JSON.parse(request.session['keycloak-token']).access_token;
  const tokenUrl = `${keycloak.config.authServerUrl}/realms/${keycloak.config.realm}/protocol/openid-connect/token`;
  const data = 'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience='+clientId;
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
  try {
    const lambdaJWT = await clientToRPTExchange(request, 'lambda');
    res = await fetchData(process.env.LAMBDA_URL, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, JSON.parse(res).message,state.status_jwks);
  } catch (e) {
    renderUI(request, response, e,state.status_jwks);
  }
});

app.post('/lambdaJwks', keycloak.protect(), keycloak.enforcer(['uiResource']), async (request, response) => {
  try {
    const lambdaJWT = await clientToRPTExchange(request, 'lambda-jwks');
    res = await fetchData(process.env.LAMBDA_JWKS_URL, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response,state.status, JSON.parse(res).message);
  } catch (e) {
    renderUI(request, response,state.status, e);
  }
});


app.get('/', keycloak.protect(), keycloak.enforcer(['uiResource']), (request, response) => {
  renderUI(request, response, '','');
});

const server = app.listen(3001, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
