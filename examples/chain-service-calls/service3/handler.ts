import fs from 'fs';

import jsonwebtoken from 'jsonwebtoken';
import KeycloakAdapter from 'keycloak-lambda-authorizer';

import {getAuthentication} from './authorizerUtil';
import {fetchData} from './restCalls';

function getKeycloakJSON(): any {
  return new Promise(((resolve, reject) => {
    fs.readFile(`${__dirname}/keycloak-service3.json`, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  }));
}

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
});

function getToken(event: any): any {
  const tokenString = event.authorizationToken || event.headers.Authorization;
  if (!tokenString) {
    throw new Error('Expected \'event.authorizationToken\' parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
  }
  const tokenStringValue = match[1];
  const decode: any = jsonwebtoken.decode(tokenStringValue);
  return {...decode, tokenString: tokenStringValue};
}

export async function service3Api(event: any, context: any, callback: any) {
  const token = getToken(event);
  const {message} = event.queryStringParameters;

  const res = await fetchData(`${process.env.SERVICE2_URL}service2Api?message=${message}->service3`, 'GET', {
    Authorization: `Bearer ${token.tokenString}`,
  });
  callback(null, {
    statusCode: 200,
    body: res,
  });
}

export async function auth0(event: any) {
  const token = await keycloakAdapter.getAWSLambdaAdapter().validate(event, {
    resource: {
      name: 'Service 3 Resource',
    },
  });
  return token.token.payload;
}

function getDecodedToken(event: any) {
  try {
    return getToken(event);
  } catch (e) {
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
