import { lamdaEdge } from 'keycloak-lambda-authorizer';
import { SessionManager } from 'keycloak-lambda-authorizer/src/edge/storage/SessionManager';
import { LocalSessionStorage } from 'keycloak-lambda-authorizer/src/edge/storage/localSessionStorage';
import { DynamoDbSessionStorage } from 'keycloak-cloudfront-dynamodb/DynamoDbSessionStorage';
import { privateKey, publicKey } from './sessionKeys';
import {
  tenant1KeycloakJson,
  tenant1Options,
  tenant2KeycloakJson,
  tenant2Options,
} from './Tentants';

const keycloakJson1 = tenant1KeycloakJson;
const keycloakJson2 = tenant2KeycloakJson;

function tenant2ResponseHandler(request, options) {
  const { uri } = request;
  const keycloakJson = options.keycloakJson(options);
  if (uri.startsWith(`/${keycloakJson.realm}/api`)) {
    return {
      status: '200',
      statusDescription: 'OK',
      body: JSON.stringify({ tenant2: 'success' }),
    };
  }
  return request;
}
lamdaEdge.routes.addJwksEndpoint('/cert', publicKey.key);
lamdaEdge.routes.addProtected(
  ['tenant2.html', keycloakJson2.realm],
  keycloakJson2,
  {
    ...tenant2Options,
    ...{ responseHandler: tenant2ResponseHandler },
  },
);

function tenant1ResponseHandler(request, options) {
  const { uri } = request;
  const keycloakJson = options.keycloakJson(options);
  if (uri.startsWith(`/${keycloakJson.realm}/api`)) {
    return {
      status: '200',
      statusDescription: 'OK',
      body: JSON.stringify({ tenant1: 'success' }),
    };
  }
  return request;
}

lamdaEdge.routes.addProtected(
  ['/', 'tenant1.html', keycloakJson1.realm],
  keycloakJson1,
  {
    ...tenant1Options,
    ...{ responseHandler: tenant1ResponseHandler },
  },
);
// eslint-disable-next-line import/prefer-default-export
export async function authorization(event, context, callback) {
  await lamdaEdge.lambdaEdgeRouter(event, context, new SessionManager(
    event.localhost ? new LocalSessionStorage()
      : new DynamoDbSessionStorage({ region: 'us-east-1' }, 'exampleSessionTable'),
    {
      keys: {
        privateKey,
        publicKey,
      },
    },
  ), callback);
}
