import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
import { apigateway } from 'keycloak-lambda-authorizer';

import { getAuthentication } from './authorizerUtil';
import { fetchData } from './restCalls';

function getKeycloakJSON() {
  return new Promise(((resolve, reject) => {
    fs.readFile(`${__dirname}/keycloak-service3.json`, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  }));
}

function getToken(event) {
  const tokenString = event.authorizationToken || event.headers.Authorization;
  if (!tokenString) {
    throw new Error('Expected \'event.authorizationToken\' parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
  }
  const tokenStringValue = match[1];
  return { ...jsonwebtoken.decode(tokenStringValue), tokenString: tokenStringValue };
}

export async function service3Api(event, context, callback) {
  const token = getToken(event);
  const { message } = event.queryStringParameters;

  const res = await fetchData(`${process.env.SERVICE2_URL}service2Api?message=${message}->service3`, 'GET', {
    Authorization: `Bearer ${token.tokenString}`,
  });
  callback(null, {
    statusCode: 200,
    body: res,
  });
}

export async function auth0(event) {
  const keycloakJSON = await getKeycloakJSON();
  const token = await apigateway.awsAdapter(event, keycloakJSON, {
    enforce: {
      enabled: true,
      resource: {
        name: 'Service 3 Resource',
      },
    },
  });
  return token.payload;
}

function getDecodedToken(event) {
  try {
    return getToken(event);
  } catch (e) {
    return null;
  }
}

export function auth(event, context, callback) {
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
    callback('Unauthorized'); // Invalid Token. 401 error
  }
}
