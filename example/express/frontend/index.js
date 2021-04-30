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
    host1: process.env.SERVICE_URL,
    ...data,
  });
}

app.post('/express', keycloak.protect(), async (request, response) => {
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
  } catch (e) {
    renderUI(request, response, {
      status1: e,
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.get('/', keycloak.protect(), (request, response) => {
  renderUI(request, response, '', '');
});

const server = app.listen(3001, () => {
  const host = 'localhost';
  const { port } = server.address();
  console.log('Example app listening at http://%s:%s', host, port);
});
