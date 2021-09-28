import fs from 'fs';

import jsonwebtoken from 'jsonwebtoken';
import KeycloakAdapter from 'keycloak-lambda-authorizer';
import {AdapterContent, KeycloakJsonStructure, RequestContent} from "keycloak-lambda-authorizer/dist/src/Options";

import {getAuthentication} from '../serverless/authorizerUtil';

import {publicKey, privateKey} from './rsaUtils';

function getKeycloakJSON() {
  return new Promise(((resolve, reject) => {
    fs.readFile(`${__dirname}/keycloak-jwks.json`, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  }));
}

const keycloakAdapter = new KeycloakAdapter({
  // eslint-disable-next-line no-unused-vars
  keycloakJson: async (options: AdapterContent, requestContent: RequestContent) => {
    const keycloakJson = await getKeycloakJSON();
    return <KeycloakJsonStructure>keycloakJson;
  },
  keys: {
    privateKey: {
      key: privateKey,
    },
    publicKey: {
      key: publicKey,
    },
  },
});

function getToken(event: any) {
  const tokenString = event.authorizationToken || event.headers.Authorization;
  if (!tokenString) {
    throw new Error('Expected \'event.authorizationToken\' parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
  }
  const tokenStringValue = match[1];
  return jsonwebtoken.decode(tokenStringValue);
}

export function hello(event: any, context: any, callback: any) {
  const token: any = getToken(event);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Hi ${token.preferred_username}. Your function executed successfully!`,
      },
        ),
  });
}

export async function auth0(event: any) {
  const requestContent = await keycloakAdapter.getAPIGateWayAdapter().validate(event, {
    resource: {
      name: 'LambdaResource',
      uri: 'LambdaResource123',
      matchingUri: true,
    },
  });
  return requestContent.token.payload;
}

function getDecodedToken(event: any) {
  try {
    return getToken(event);
  } catch (e:any) {
    return null;
  }
}

export function auth(event: any, context: any, callback: any) {
  const token = getDecodedToken(event);
  if (token) {
    auth0(event).then((jwt) => {
      getAuthentication(jwt, 'Allow')
        .then((res) => {
          callback(null, res);
        })
        .catch((e) => {
          console.error('getAuthentication error', e);
          callback('Unauthorized');
        });
    }).catch((e) => {
      console.error('auth0 error', e);
      getAuthentication(token, 'Deny')
        .then((res) => {
          callback(null, res);
        })
        .catch((e1) => {
          console.error('getAuthentication error', e1);
          callback('Unauthorized');
        });
    });
  } else {
    // Invalid Token. 401 error
    callback('Unauthorized');
  }
}

export function cert(event: any, context: any, callback: any) {
  const jwksResponse = keycloakAdapter.getJWKS().json({
    key: publicKey,
  });
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(jwksResponse),
  });
}
