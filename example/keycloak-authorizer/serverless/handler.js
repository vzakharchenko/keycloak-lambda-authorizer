import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
import { getAuthentication } from '../../common/authorizerUtil';
import { handler } from '../../../index';

function getKeycloakJSON() {
  return new Promise(((resolve, reject) => {
    fs.readFile(`${__dirname}/keycloak.json`, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  }));
}

function getToken(event) {
  const { headers } = event;
  const tokenString = headers ? headers.Authorization : null;
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
  const token = await handler(event, keycloakJSON, {
    enforce: { enabled: true, resource: 'LambdaResource123' },
  });
  return token.decoded.payload;
}

export function auth(event, context, callback) {
  auth0(event).then((jwt) => {
    getAuthentication(jwt)
      .then((res) => {
        callback(null, res);
      })
      .catch((e) => {
        console.error('getAuthentication error', e);
        callback('Unauthorized');
      });
  }).catch((e) => {
    console.error('getAuthentication error', e);
    callback('Unauthorized');
  });
}
