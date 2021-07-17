import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
import KeycloakAdapter from 'keycloak-lambda-authorizer';

import { getAuthentication } from './authorizerUtil';

function getKeycloakJSON():any {
  return new Promise(((resolve, reject) => {
    fs.readFile(`${__dirname}/keycloak-service2.json`, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  }));
}

const keycloakAdapter = new KeycloakAdapter({
  keycloakJson: getKeycloakJSON(),
});

function getToken(event:any):any {
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

export function service2Api(event:any, context:any, callback:any) {
  const token = getToken(event);
  const { message } = event.queryStringParameters;
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Hi ${token.preferred_username}. Your function executed successfully!\n Chain of calls:\n ${message}->Service2`,
      },
    ),
  });
}

export async function auth0(event:any) {
  const token = await keycloakAdapter.getAPIGateWayAdapter().validate(event, {
    resource: {
      name: 'Service 2 Resource',
    },
  });
  return token.token.payload;
}

function getDecodedToken(event:any) {
  try {
    return getToken(event);
  } catch (e) {
    return null;
  }
}

export function auth(event:any, context:any, callback:any) {
  const token = getDecodedToken(event);
  if (token) {
    auth0(event).then((jwt) => {
      getAuthentication(jwt, 'Allow')
        .then((res:any) => {
          callback(null, res);
        })
        .catch((e:any) => {
          console.error('getAuthentication error', e);
          callback('Unauthorized');
        });
    }).catch((e) => {
      console.error('auth0 error', e);
      getAuthentication(token, 'Deny')
        .then((res:any) => {
          callback(null, res);
        })
        .catch((e1:any) => {
          console.error('getAuthentication error', e1);
          callback('Unauthorized');
        });
    });
  } else {
    callback('Unauthorized'); // Invalid Token. 401 error
  }
}
