- [![CircleCI](https://circleci.com/gh/vzakharchenko/keycloak-lambda-authorizer.svg?style=svg)](https://circleci.com/gh/vzakharchenko/keycloak-lambda-authorizer)
- [![npm version](https://badge.fury.io/js/keycloak-lambda-authorizer.svg)](https://badge.fury.io/js/keycloak-lambda-authorizer)
- [![Coverage Status](https://coveralls.io/repos/github/vzakharchenko/keycloak-lambda-authorizer/badge.svg?branch=master)](https://coveralls.io/github/vzakharchenko/keycloak-lambda-authorizer?branch=master)
- [![Maintainability](https://api.codeclimate.com/v1/badges/0b56148967afc99a64df/maintainability)](https://codeclimate.com/github/vzakharchenko/keycloak-lambda-authorizer/maintainability)
- [![Node.js 12.x, 14.x, 15.x, 17.x CI](https://github.com/vzakharchenko/keycloak-lambda-authorizer/actions/workflows/nodejs.yml/badge.svg)](https://github.com/vzakharchenko/keycloak-lambda-authorizer/actions/workflows/nodejs.yml)
- [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=vzakharchenko_keycloak-lambda-authorizer&metric=bugs)](https://sonarcloud.io/dashboard?id=vzakharchenko_keycloak-lambda-authorizer)
- [![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=vzakharchenko_keycloak-lambda-authorizer&metric=sqale_index)](https://sonarcloud.io/dashboard?id=vzakharchenko_keycloak-lambda-authorizer)
- [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=vzakharchenko_keycloak-lambda-authorizer&metric=security_rating)](https://sonarcloud.io/dashboard?id=vzakharchenko_keycloak-lambda-authorizer)
- [![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://secure.wayforpay.com/button/b18610f33a01c)


# Description
Implementation [Keycloak](https://www.keycloak.org/) adapter for Cloud
## Features
- supports AWS API Gateway
- Resource based authorization ( [Keycloak Authorization Services](https://www.keycloak.org/docs/latest/authorization_services/) )
- works with non amazon services.
- [Service to Service communication](./examples/userToAdminAPI).
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
 - [Serverless example (Api gateway with lambda authorizer)](examples/keycloak-authorizer/README.md)
 - [Example of expressjs middleware](examples/express)
 - [Example of expressjs middleware with security resource scopes](examples/express-scopes)
 - [Example of calling a chain of micro services, where each service is protected by its secured client](examples/chain-service-calls)
 - [Example of calling the Admin API Using the regular User Permissions (Role or Resource)](examples/userToAdminAPI)
 - [CloudFront with Lambda:Edge example](https://github.com/vzakharchenko/keycloak-api-gateway/blob/master/examples/reactJSExample)
 - [CloudFront with portal authorization (switching between security realms)](https://github.com/vzakharchenko/keycloak-api-gateway/blob/master/examples/crossTenantReactJSExample)
# How to use

### Role Based
```javascript
import  KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJSON = ...; // read Keycloak.json

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJSON,
});

export async  function authorizer(event, context, callback) {

    const requestContent = await keycloakAdapter.getAPIGateWayAdapter().validate(event, {
     role: 'SOME_ROLE',
    });
}
```
### Client Role Based
```javascript
import  KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJSON = ...; // read Keycloak.json

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJSON,
});

export async  function authorizer(event, context, callback) {
    const requestContent = await keycloakAdapter.getAPIGateWayAdapter().validate(event, {
     clientRole:{role: 'SOME_ROLE', clientId: 'Client Name'}
    });
}
```

### Resource Based (Keycloak Authorization Services)
```javascript
import  KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJSON = ...; // read Keycloak.json

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJSON,
});

export function authorizer(event, context, callback) {
    const requestContent = await keycloakAdapter.getAPIGateWayAdapter().validate(event, {
    resource: {
    name: 'SOME_RESOURCE',
    uri: 'RESOURCE_URI',
    matchingUri: true,
    },
   });
}
```

# Configuration

## Option structure:
```javascript
 {
    keys: ClientJwtKeys,
    keycloakJson: keycloakJsonFunction
 }
```
## Resource Structure:

```javascript
{
    name?: string,
    uri?: string,
    owner?: string,
    type?: string,
    scope?: string,
    matchingUri?: boolean,
    deep?: boolean,
    first?: number,
    max?: number,
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
import  KeycloakAdapter from 'keycloak-lambda-authorizer';
import winston from 'winston';

const keycloakJSON = ...; // read Keycloak.json

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJSON,
  logger:winston
});

```

## ExpressJS middleware

```js
import fs from 'fs';
import express from 'express';
import KeycloakAdapter from 'keycloak-lambda-authorizer';

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
});

const app = express();

app.get('/expressServiceApi', keycloakAdapter.getExpressMiddlewareAdapter().middleware({
  resource: {
    name: 'service-api',
  },
}),
async (request:any, response) => {
  response.json({
    message: `Hi ${request.jwt.payload.preferred_username}. Your function executed successfully!`,
  });
});
```

## Get Service Account Token
 - ExpressJS
```js

import fs from 'fs';
import express from 'express';
import KeycloakAdapter from 'keycloak-lambda-authorizer';

function getKeycloakJSON() {
  return JSON.parse(fs.readFileSync(`${__dirname}/keycloak.json`, 'utf8'));
}

const expressMiddlewareAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
}).getExpressMiddlewareAdapter();

const app = express();

app.get('/expressServiceApi', expressMiddlewareAdapter.middleware(
  {
    resource: {
      name: 'service-api',
    },
  },
),
async (request:any, response) => {
  const serviceJWT = await request.serviceAccountJWT();
 ...
});
```
- AWS Lambda/Serverless or another cloud

```js
import KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJson = ...;

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJson,
});

async function getServiceAccountJWT(){
   return await keycloakAdapter.serviceAccountJWT();
}
...
const serviceAccountToken = await getServiceAccountJWT();
...
```

- AWS Lambda/Serverless or another cloud with Signed JWT

```js
import KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJson = ...;

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJson,
  keys: {
      privateKey: {
        key: privateKey,
      },
      publicKey: {
        key: publicKey,
      },
    }
});

async function getServiceAccountJWT(){
   return await keycloakAdapter.serviceAccountJWT();
}
...

const serviceAccountToken = await getServiceAccountJWT();

```

## Cache
Example of cache:
```javascript

export class DefaultCache implements AdapterCache {
  async get(region: string, key: string): Promise<string | undefined> {
    ...
  }

  async put(region: string, key: string, value: any, ttl: number): Promise<void> {
    ...
  }
}

```
### Cache Regions:

- **publicKey** - Cache for storing Public Keys. (The time to live - 180 sec)
- **uma2-configuration** - uma2-configuration link. example of link http://localhost:8090/auth/realms/lambda-authorizer/.well-known/uma2-configuration (The time to live - 180 sec)
- **client_credentials** - Service Accounts Credential Cache (The time to live - 180 sec).
- **resource** - Resources Cache (The time to live - 30 sec).
- **rpt** - Resources Cache (The time to live - refresh token expiration time).

### Change Cache:

```javascript

import  KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJSON = ...; // read Keycloak.json

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJSON,
  cache:newCache
});
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
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -subj "/CN=<CLIENT-ID>" -keyout server.key -out server.crt
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
import KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJson = ...;

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJson,
  keys: {
      privateKey: {
        key: privateKey,
      },
      publicKey: {
        key: publicKey,
      },
    }
});

  const jwksResponse = keycloakAdapter.getJWKS().json({
    key: publicKey,
  });
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(jwksResponse),
  });
```
 - Keycloak Settings
![Keycloak Admin Console 2020-04-12 13-30-26](docs/Keycloak%20Admin%20Console%202020-04-12%2013-30-26.png)


### Create Api GateWay Authorizer function

```javascript
import KeycloakAdapter from 'keycloak-lambda-authorizer';

const keycloakJson = ...;

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJson
});

export async function authorizer(event, context, callback) {
   const requestContent = await keycloakAdapter.getAPIGateWayAdapter().validate(event, {
       resource: {
         name: 'LambdaResource',
         uri: 'LambdaResource123',
         matchingUri: true,
     },
   });
   return requestContent.token.payload;
}
```

# Implementation For Custom Service or non amazon cloud

```javascript
import KeycloakAdapter from 'keycloak-lambda-authorizer';

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

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJson
}).getDefaultAdapter();


async function handler(request,response) {
  const authorization = request.headers.Authorization;
  const match = authorization.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${authorization}' does not match 'Bearer .*'`);
  }
  const jwtToken =  match[1];
  await keycloakAdapter.validate(jwtToken, {
                                          resource: {
                                            name: 'SOME_RESOURCE',
                                            uri: 'RESOURCE_URI',
                                            matchingUri: true,
                                          },
                                      });
...
}
```
# Validate and Refresh Token

```javascript
import KeycloakAdapter from 'keycloak-lambda-authorizer';

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

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: keycloakJson
}).getDefaultAdapter();


async function handler(request,response) {
  let tokenJson:TokenJson = readCurrentToken();
  const authorization = {
                          resource: {
                            name: 'SOME_RESOURCE',
                            uri: 'RESOURCE_URI',
                            matchingUri: true,
                          },
                         }
  try{
    await keycloakAdapter.validate(tokenJson.access_token, authorization);
  } catch(e){
   tokenJson =  await keycloakAdapter.refreshToken(tokenJson, authorization);
   writeToken(tokenJson)
  }
...
}
```

# If you find these useful, please [Donate](https://secure.wayforpay.com/button/b18610f33a01c)!
