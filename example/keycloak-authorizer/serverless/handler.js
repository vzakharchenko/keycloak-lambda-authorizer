import fs from 'fs';
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

export function hello(event, context, callback) {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Your function executed successfully!',
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
