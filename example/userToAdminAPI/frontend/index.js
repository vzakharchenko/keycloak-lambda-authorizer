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
  users: [],
  clients: [],
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

app.post('/getUserList', keycloak.protect(), async (request, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE_URL}getUserList`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    renderUI(request, response, {
      users: JSON
        .parse(res),
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      users: [{ name: e }],
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  }
});

app.post('/getClientList', keycloak.protect(), async (request, response) => {
  const lambdaJWT = JSON.parse(request.session['keycloak-token']);
  try {
    const res = await fetchData(`${process.env.SERVICE_URL}getClientList`, 'GET', {
      Authorization: `Bearer ${lambdaJWT.access_token}`,
    });
    const clients = JSON
      .parse(res);
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < clients.length; i++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const res2 = await fetchData(`${process.env.SERVICE_URL}getSecret?clientId=${clients[i].id}`, 'GET', {
          Authorization: `Bearer ${lambdaJWT.access_token}`,
        });
        clients[i].type = JSON.parse(res2).type;
        clients[i].secret = JSON.parse(res2).value;
      } catch (e) {
        clients[i].secret = e;
      }
    }
    renderUI(request, response, {
      clients,
      status1Token: JSON
        .stringify(jsonwebtoken.decode(lambdaJWT.access_token), null, 2),
    });
  } catch (e) {
    renderUI(request, response, {
      clients: [{ name: e }],
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
