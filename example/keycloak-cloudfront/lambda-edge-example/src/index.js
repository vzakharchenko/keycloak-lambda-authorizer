import { lamdaEdge } from 'keycloak-lambda-authorizer';
import { SessionManager } from 'keycloak-lambda-authorizer/src/edge/storage/SessionManager';
import { LocalSessionStorage } from 'keycloak-lambda-authorizer/src/edge/storage/localSessionStorage';
import { privateKey, publicKey } from './sessionKeys';
import {
  tenant1KeycloakJson,
  tenant1Options,
  tenant2KeycloakJson,
  tenant2Options,
} from './Tentants';

const keycloakJson1 = tenant1KeycloakJson;
const keycloakJson2 = tenant2KeycloakJson;

lamdaEdge.routes.addJwksEndpoint('/cert', publicKey.key);
lamdaEdge.routes.addProtected(
  ['tenant2.html'],
  keycloakJson2,
  tenant2Options,
);

lamdaEdge.routes.addProtected(
  ['/', 'tenant1.html'],
  keycloakJson1,
  tenant1Options,
);
// eslint-disable-next-line import/prefer-default-export
export async function authorization(event, context, callback) {
  await lamdaEdge.lambdaEdgeRouter(event, context, new SessionManager(new LocalSessionStorage(), {
    keys: {
      privateKey,
      publicKey,
    },
  }), callback);
}
