import { lamdaEdge } from 'keycloak-lambda-authorizer';
import { SessionManager } from 'keycloak-lambda-authorizer/src/edge/storage/SessionManager';
import { LocalSessionStorage } from 'keycloak-lambda-authorizer/src/edge/storage/localSessionStorage';
import { DynamoDbSessionStorage } from 'keycloak-cloudfront-dynamodb/DynamoDbSessionStorage';
import { privateKey, publicKey } from './sessionKeys';
import {
  portalKeycloakJSON,
  tenantKeycloakJson,
  tenantOptions,
} from './Tentants';

lamdaEdge.routes.addJwksEndpoint('/cert', publicKey.key);

function tenantResponseHandler(request, options) {
  const { uri } = request;
  const keycloakJson = options.keycloakJson(options);
  if (uri.startsWith(`/tenants/${keycloakJson.realm}/api`)) {
    return {
      status: '200',
      statusDescription: 'OK',
      body: JSON.stringify({ tenant: keycloakJson.realm, status: 'success' }),
    };
  }
  return request;
}

lamdaEdge.routes.addProtected([new RegExp('(^)(\\/|)(/tenants/(.*))(/$|(\\?|$))', 'g')],
  tenantKeycloakJson,
  {
    ...tenantOptions,
    ...{ responseHandler: tenantResponseHandler },
  });
lamdaEdge.routes.addProtected(
  ['/'],
  portalKeycloakJSON,
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
