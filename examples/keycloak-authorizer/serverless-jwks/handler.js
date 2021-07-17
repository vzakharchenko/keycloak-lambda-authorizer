import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
import { apigateway, adapter } from 'keycloak-lambda-authorizer';
import { getAuthentication } from '../serverless/authorizerUtil';
import { publicKey, privateKey } from './rsaUtils';

function getKeycloakJSON() {
  return new Promise(((resolve, reject) => {
    fs.readFile(`${__dirname}/keycloak-jwks.json`, 'utf8', (err, data) => {
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
  return jsonwebtoken.decode(tokenStringValue);
}

export function hello(event, context, callback) {
  const token = getToken(event);
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `Hi ${token.preferred_username}. Your function executed successfully!`,
      },
    ),
  });
}

export async function auth0(event) {
  const keycloakJSON = await getKeycloakJSON();
  const token = await apigateway.awsAdapter(event, keycloakJSON, {
    keys: {
      privateKey: {
        key: privateKey,
      },
      publicKey: {
        key: publicKey,
      },
    },
    enforce: {
      enabled: true,
      resource: {
        name: 'LambdaResource',
        uri: 'LambdaResource123',
        matchingUri: true,
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

export function cert(event, context, callback) {
  const jwksResponse = adapter.jwksUrl(publicKey);
  callback(null, {
    statusCode: 200,
    body: jwksResponse,
  });
}
