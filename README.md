[![CircleCI](https://circleci.com/gh/vzakharchenko/keycloak-lambda-authorizer.svg?style=svg)](https://circleci.com/gh/vzakharchenko/keycloak-lambda-authorizer)

#Description
Implementation [Keycloak](https://www.keycloak.org/) adapter for aws Lambda
## Features
- validate expiration of JWT token
- validate JWS signature
- Role based authorization
- Resource based authorization ( [Keycloak Authorization Services](https://www.keycloak.org/docs/latest/authorization_services/) )

# Installation

```
npm install keycloak-lambda-authorizer -S
```
# Examples
 - [Serverless example (Api gateway with lambda authorizer)](example/keycloak-authorizer/README.md)
# How to use with [Aws Lambda Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) :


### Role Based
```javascript
import { awsHandler } from 'keycloak-lambda-authorizer';
 
export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsHandler(event, keycloakJSON, {
    enforce: { enabled: true, role: 'SOME_ROLE' },
  }).then((token)=>{
      // Success 
  }).catch((e)=>{
    // Failed
  });
}
```

### Resource Based (Keycloak Authorization Services)
```javascript
import { awsHandler } from 'keycloak-lambda-authorizer';
 
export function authorizer(event, context, callback) {
    const keycloakJSON = ...; // read Keycloak.json
  awsHandler(event, keycloakJSON, {
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

## Json structure:
```json
{
   "cache":"defaultCache",
   "logger":console,
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

```json
{
   "name":"",
   "uri":"",
   "owner":"",
   "type":"",
   "scope":"",
   "matchingUri":false
}
```
**name** : unique name of resource  
**uri** :  URIs which are protected by resource.  
**Owner** : Owner of resource  
**type** : Type of Resource  
**scope** : The scope associated with this resource.  
**matchingUri** : matching Uri

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

## Cache
Example of cache:
```javascript
const NodeCache = require('node-cache');

const defaultCache = new NodeCache({ stdTTL: 180, checkperiod: 0, errorOnMissing: false });
const resourceCache = new NodeCache({ stdTTL: 30, checkperiod: 0, errorOnMissing: false });

export function put(region, key, value) {
  if (region === 'publicKey') {
    defaultCache.set(key, value);
  } else if (region === 'uma2-configuration') {
    defaultCache.set(key, value);
  } else if (region === 'client_credentials') {
    defaultCache.set(key, value);
  } else if (region === 'resource') {
    resourceCache.set(key, value);
  } else {
    throw new Error('Unsupported Region');
  }
}

export function get(region, key) {
  if (region === 'publicKey') {
    return defaultCache.get(key);
  } if (region === 'uma2-configuration') {
    return defaultCache.get(key);
  } if (region === 'client_credentials') {
    return defaultCache.get(key);
  } if (region === 'resource') {
    return resourceCache.get(key);
  }
  throw new Error('Unsupported Region');
}
```
### Cache Regions:

**publicKey** - Cache for storing Public Keys. (The time to live - 180 sec)  
**uma2-configuration** - uma2-configuration link. example of link http://localhost:8090/auth/realms/lambda-authorizer/.well-known/uma2-configuration (The time to live - 180 sec)  
**client_credentials** - Service Accounts Credential Cache (The time to live - 180 sec).
**resource** - Resources Cache (The time to live - 30 sec).

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



