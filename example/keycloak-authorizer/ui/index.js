const express = require('express');
const exphbs = require('express-handlebars');
const Keycloak = require('keycloak-connect');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const jsonwebtoken = require('jsonwebtoken');
const {fetchData, sendData} = require('./restCalls');

const app = express();
const memoryStore = new session.MemoryStore();


app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));


const keycloak = new Keycloak({
    store: memoryStore
});

app.use(keycloak.middleware());


app.use(bodyParser.urlencoded({extended: true}));

app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}));

app.set('view engine', '.hbs');

app.set('views', path.join(__dirname, 'views'));

function renderUI(request, response, status) {
    response.render('home', {
        status, host: process.env.LAMBDA_URL
    })
}

app.post('/', keycloak.protect(), async (request, response) => {
    const lambdaJWT = await clientToRPTExchange(request);
    res = await fetchData(process.env.LAMBDA_URL, 'GET', {
        'Authorization': `Bearer ${lambdaJWT.access_token}`
    });
    renderUI(request, response, JSON.parse(res).message);
});


app.get('/', keycloak.protect(), (request, response) => {
    renderUI(request, response, "");
});


async function clientToRPTExchange(request) {
    const token = JSON.parse(request.session['keycloak-token']).access_token;
    const tokenUrl = `${keycloak.config.authServerUrl}/realms/${keycloak.config.realm}/protocol/openid-connect/token`;
    const data = `grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience=lambda`;
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
        throw e;
    }
}

const server = app.listen(3001, () => {
    const host = 'localhost';
    const port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});