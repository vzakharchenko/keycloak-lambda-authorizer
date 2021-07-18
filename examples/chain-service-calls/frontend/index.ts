import path from 'path';

import jsonwebtoken from 'jsonwebtoken';
import express from 'express';
import exphbs from 'express-handlebars';
import Keycloak from 'keycloak-connect';
import bodyParser from 'body-parser';
import session from 'express-session';

import {fetchData} from './restCalls';

const app = express();
const memoryStore = new session.MemoryStore();
const state = {
  status1: '',
  status2: '',
  status3: '',
  status4: '',
  status1Token: '',
  status2Token: '',
  status3Token: '',
  status4Token: '',
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
    host1: process.env.SERVICE1_URL,
    host2: process.env.SERVICE2_URL,
    host3: process.env.SERVICE3_URL,
    ...data,
  });
}

app.post('/service1api1', keycloak.protect(), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE1_URL}service1api1?message=frontend`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      status1: JSON
        .parse(res).message,
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      status1: e,
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.post('/service1api2', keycloak.protect(), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE1_URL}service1api2?message=frontend`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      status2: JSON
        .parse(res).message,
      status2Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      status2: e,
      status2Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.post('/service2api', keycloak.protect(), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE2_URL}service2Api?message=frontend`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      status3: JSON
        .parse(res).message,
      status3Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      status3: e,
      status3Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.post('/service3api', keycloak.protect(), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE3_URL}service3Api?message=frontend`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      status4: JSON
        .parse(res).message,
      status4Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      status4: e,
      status4Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.get('/', keycloak.protect(), (request, response) => {
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
