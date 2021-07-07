- [![CircleCI](https://circleci.com/gh/vzakharchenko/keycloak-lambda-authorizer.svg?style=svg)](https://circleci.com/gh/vzakharchenko/keycloak-lambda-authorizer)
- [![npm version](https://badge.fury.io/js/keycloak-lambda-authorizer.svg)](https://badge.fury.io/js/keycloak-lambda-authorizer)
- [![Coverage Status](https://coveralls.io/repos/github/vzakharchenko/keycloak-lambda-authorizer/badge.svg?branch=master)](https://coveralls.io/github/vzakharchenko/keycloak-lambda-authorizer?branch=master)
- [![Maintainability](https://api.codeclimate.com/v1/badges/0b56148967afc99a64df/maintainability)](https://codeclimate.com/github/vzakharchenko/keycloak-lambda-authorizer/maintainability)
- [![Node.js 10.x, 12.x, 13.x, 14.x, 15.x CI](https://github.com/vzakharchenko/keycloak-lambda-authorizer/actions/workflows/nodejs.yml/badge.svg)](https://github.com/vzakharchenko/keycloak-lambda-authorizer/actions/workflows/nodejs.yml)
- [![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://secure.wayforpay.com/button/b18610f33a01c)


# Description
Implementation [Keycloak](https://www.keycloak.org/) adapter for Cloud
## Features
- supports AWS API Gateway
- Resource based authorization ( [Keycloak Authorization Services](https://www.keycloak.org/docs/latest/authorization_services/) )
- works with non amazon services.
- [Service to Service communication](./example/userToAdminAPI).
- validate expiration of JWT token
- validate JWS signature
- supports "clientId/secret" and "client-jwt" credential types
- Role based authorization
- support MultiTenancy
- [cross-realm authentication](https://github.com/vzakharchenko/keycloak-api-gateway/tree/master/examples/crossTenantReactJSExample)
** Note: supporting Lambda@Edge moved to [https://github.com/vzakharchenko/keycloak-api-gateway](https://github.com/vzakharchenko/keycloak-api-gateway) **
# Installation

```
npm install keycloak-lambda-authorizer -S
```
# Examples
 - [Serverless example (Api gateway with lambda authorizer)](example/keycloak-authorizer/README.md)
 - [Example of expressjs middleware](example/express)
 - [Example of expressjs middleware with security resource scopes](example/express-scopes)
 - [Example of calling a chain of micro services, where each service is protected by its secured client](example/chain-service-calls)
 - [Example of calling the Admin API Using the regular User Permissions (Role or Resource)](example/userToAdminAPI)
 - [CloudFront with Lambda:Edge example](example/keycloak-cloudfront/README.md)
 - [CloudFront with portal authorization (switching between security realms)](example/keycloak-cloudfront-portal)
# How to use

### Role Based
```javascript
import { apigateway } from 'keycloak-lambda-authorizer';

export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsAdapter.awsHandler(event, keycloakJSON, {
    enforce: { enabled: true, role: 'SOME_ROLE' },
  }).then((token)=>{
      // Success
  }).catch((e)=>{
    // Failed
  });
}
```
### Client Role Based
```javascript
import { apigateway } from 'keycloak-lambda-authorizer';

export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsAdapter.awsHandler(event, keycloakJSON, {
    enforce: { enabled: true,  clientRole: {roleName: 'SOME_ROLE',clientId: 'Client Name',}, },
  }).then((token)=>{
      // Success
  }).catch((e)=>{
    // Failed
  });
}
```

### Resource Based (Keycloak Authorization Services)
```javascript
import { apigateway } from 'keycloak-lambda-authorizer';

export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  apigateway.awsHandler(event, keycloakJSON, {
    enforce: {
      enabled: true,
      resource: {
        name: 'SOME_RESOURCE',
        uri: 'RESOURCE_URI',
        matchingUri: true,
      },
    },
  }).then((token)=>{
      // Success
  }).catch((e)=>{
    // Failed
  });
}
```

# Configuration

## Option structure:
```javascript
{
   "cache":"defaultCache",
   "logger":console,
   "keys":{
      "privateKey":{
        "key": privateKey,
        "passphrase": 'privateKey passphrase'
      },
      "publicKey":{
        "key": publicKey,
      }
    },
   "enforce":{
      "enabled":true,
      "resource":{
         "name":"SOME_RESOURCE",
         "uri":"/test",
         "owner":"...",
         "type":"...",
         "scope":"...",
         "matchingUri":false,
         "deep":false
      },
      "resources":[
         {
            "name":"SOME_RESOURCE1",
            "uri":"/test1",
            "owner":"...",
            "type":"...",
            "scope":"...",
            "matchingUri":false,
            "deep":false
         },
         {
            "name":"SOME_RESOURCE2",
            "uri":"/test2",
            "owner":"...",
            "type":"...",
            "scope":"...",
            "matchingUri":false,
            "deep":false
         }
      ]
   }
}
}
```
## Resource Structure:

```javascript
{
   "name":"",
   "uri":"",
   "owner":"",
   "type":"",
   "scope":"",
   "matchingUri":false
}
```
- **name** : unique name of resource
- **uri** :  URIs which are protected by resource.
- **Owner** : Owner of resource
- **type** : Type of Resource
- **scope** : The scope associated with this resource.
- **matchingUri** : matching Uri

![Keycloak Admin Console 2020-04-11 23-58-06](docs/Keycloak%20Admin%20Console%202020-04-11%2023-58-06.png)

## Change logger
```javascript
awsHandler(event, keycloakJSON, {
      logger:winston,
      ...
  }).then().catch()
```
```javascript
const winston from 'winston';
import { awsHandler } from 'keycloak-lambda-authorizer';

export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsHandler(event, keycloakJSON, {
      logger:winston
  }).then((token)=>{
      // Success
  }).catch((e)=>{
    // Failed
  });
}
```

## ExpressJS middleware

```js
const fs = require('fs');
const { middlewareAdapter } = require('keycloak-lambda-authorizer');

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const app = express();

app.get('/expressServiceApi', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'service-api',
      },
    },
  },
).middleware,
async (request, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function executed successfully!`,
  });
});
```

## Get Service Account Token
 - ExpressJS
```js
const fs = require('fs');
const { middlewareAdapter } = require('keycloak-lambda-authorizer');

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const app = express();

app.get('/expressServiceApi', middlewareAdapter(
  getKeycloakJSON(),
  {
    enforce: {
      enabled: true,
      resource: {
        name: 'service-api',
      },
    },
  },
).middleware,
async (request, response) => {
  const serviceAccountToken = await request.serviceAccountJWT();
  ...
});
```
- AWS Lambda/Serverless or another cloud

```js
const { serviceAccountJWT } = require('keycloak-lambda-authorizer/src/serviceAccount');

const keycloakJSON = ...

async function getServiceAccountJWT(){
   return serviceAccountJWT(keycloakJSON);
}

...

const serviceAccountToken = await getServiceAccountJWT();
```

- AWS Lambda/Serverless or another cloud with Signed JWT

```js
const { serviceAccountJWT } = require('keycloak-lambda-authorizer/src/serviceAccount');

const keycloakJSON = ...
const options = {
    "keys":{
          "privateKey":{
            "key": privateKey,
            "passphrase": 'privateKey passphrase'
          },
          "publicKey":{
            "key": publicKey,
          }
        }
}

async function getServiceAccountJWT(){
   return serviceAccountJWT(keycloakJSON,options);
}

...

const serviceAccountToken = await getServiceAccountJWT();
```




## Cache
Example of cache:
```javascript
const NodeCache = require('node-cache');

const defaultCache = new NodeCache({ stdTTL: 180, checkperiod: 0, errorOnMissing: false });
const rptCache = new NodeCache({ stdTTL: 1800, checkperiod: 0, errorOnMissing: false });
const resourceCache = new NodeCache({ stdTTL: 30, checkperiod: 0, errorOnMissing: false });

async function put(region, key, value, ttl) {
  if (region === 'publicKey') {
    defaultCache.set(key, value, ttl);
  } else if (region === 'uma2-configuration') {
    defaultCache.set(key, value, ttl);
  } else if (region === 'client_credentials') {
    defaultCache.set(key, value, ttl);
  } else if (region === 'resource') {
    resourceCache.set(key, value, ttl);
  } else if (region === 'rpt') {
    rptCache.set(key, value, ttl);
  } else {
    throw new Error('Unsupported Region');
  }
}

async function get(region, key) {
  if (region === 'publicKey') {
    return defaultCache.get(key);
  } if (region === 'uma2-configuration') {
    return defaultCache.get(key);
  } if (region === 'client_credentials') {
    return defaultCache.get(key);
  } if (region === 'resource') {
    return resourceCache.get(key);
  } if (region === 'rpt') {
    return rptCache.get(key);
  }
  throw new Error('Unsupported Region');
}

module.exports = {
  put,
  get,
};
```
### Cache Regions:

- **publicKey** - Cache for storing Public Keys. (The time to live - 180 sec)
- **uma2-configuration** - uma2-configuration link. example of link http://localhost:8090/auth/realms/lambda-authorizer/.well-known/uma2-configuration (The time to live - 180 sec)
- **client_credentials** - Service Accounts Credential Cache (The time to live - 180 sec).
- **resource** - Resources Cache (The time to live - 30 sec).
- **rpt** - Resources Cache (The time to live - refresh token expiration time).

### Change Cache:

```javascript
import { awsHandler } from 'keycloak-lambda-authorizer';

export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsHandler(event, keycloakJSON, {
      cache: newCache,
  }).then((token)=>{
      // Success
  }).catch((e)=>{
    // Failed
  });
}
```

## Client Jwt Credential Type

###  - RSA Keys Structure

```javascript
{
   "privateKey":{
      "key":"privateKey",
      "passphrase":"privateKey passphrase"
   },
   "publicKey":{
      "key":"publicKey"
   }
}
```
- privateKey.**key** - RSA Private Key
- privateKey.**passphrase** - word or phrase that protects private key
- publicKey.**key** - RSA Public Key or Certificate

###  RSA keys generation example using openssl

```bash
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=lambda-jwks" -keyout server.key -out server.crt
```

### Create JWKS endpoint by AWS API Gateway

 - serverless.yaml
```yaml
functions:
  cert:
    handler: handler.cert
    events:
      - http:
          path: cert
          method: GET
```
 - lambda function (handler.cert)
```javascript
import { jwksUrl } from 'keycloak-lambda-authorizer';

export function cert(event, context, callback) {
  const jwksResponse = jwksUrl(publicKey);
  callback(null, {
    statusCode: 200,
    body: jwksResponse,
  });
}
```
 - Keycloak Settings
![Keycloak Admin Console 2020-04-12 13-30-26](docs/Keycloak%20Admin%20Console%202020-04-12%2013-30-26.png)


### Create Api GateWay Authorizer function

```javascript
import { awsHandler } from 'keycloak-lambda-authorizer';

export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsHandler(event, keycloakJSON, {
    keys:{
      privateKey:{
        key: privateKey,
      },
      publicKey:{
        key: publicKey,
      }
    },
    enforce: {
      enabled: true,
      resource: {
        name: 'SOME_RESOURCE',
        uri: 'RESOURCE_URI',
        matchingUri: true,
      },
    },
  }).then((token)=>{
      // Success
  }).catch((e)=>{
    // Failed
  });
}
```

# Implementation For Custom Service or non amazon cloud

```javascript
import { adapter } from 'keycloak-lambda-authorizer';

const keycloakJson = {
   "realm": "lambda-authorizer",
   "auth-server-url": "http://localhost:8090/auth",
   "ssl-required": "external",
   "resource": "lambda",
   "verify-token-audience": true,
   "credentials": {
     "secret": "772decbe-0151-4b08-8171-bec6d097293b"
   },
   "confidential-port": 0,
   "policy-enforcer": {}
}

async function handler(request,response) {
  const authorization = request.headers.Authorization;
  const match = authorization.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${authorization}' does not match 'Bearer .*'`);
  }
  const jwtToken =  match[1];
  await adapter(jwtToken,keycloakJson, {
                                        enforce: {
                                          enabled: true,
                                          resource: {
                                            name: 'SOME_RESOURCE',
                                            uri: 'RESOURCE_URI',
                                            matchingUri: true,
                                          },
                                        },
                                      });
...
}
```

# If you find these useful, please [Donate](https://secure.wayforpay.com/button/b18610f33a01c)!
