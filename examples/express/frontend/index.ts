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
  status1Token: '',
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
    host1: process.env.SERVICE_URL,
    ...data,
  });
}

app.post('/express', keycloak.protect(), async (request:any, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE_URL}expressServiceApi`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      status1: JSON
        .parse(res).message,
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e:any) {
    renderUI(request, response, {
      status1: e,
      status1Token: JSON
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
