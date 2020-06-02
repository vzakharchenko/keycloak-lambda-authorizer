import { privateKey, publicKey } from './sessionKeys';

export const portalKeycloakJSON = {
  realm: 'portal',
  'auth-server-url': 'http://127.0.0.1:8090/auth/',
  'ssl-required': 'external',
  resource: 'portal-ui',
  credentials: {
    secret: 'ece2012c-fc01-4dca-b50b-f898c9c6c811',
  },
  'confidential-port': 0,
};

export const tenant1KeycloakJson = {
  realm: 'securityRealm2',
  'auth-server-url': 'http://localhost:8090/auth/',
  'ssl-required': 'external',
  resource: 'tenant1Client',
  'verify-token-audience': true,
  credentials: {
    jwt: { },
  },
  'confidential-port': 0,
  'policy-enforcer': {},
};

export const tenant1Options = {
  enforce: {
    enabled: true,
    resource: {
      name: 'tenant1Resource',
    },
  },
};


export const tenant2KeycloakJson = {
  realm: 'securityRealm2',
  'auth-server-url': 'http://localhost:8090/auth',
  'ssl-required': 'external',
  resource: 'tenant2Client',
  'verify-token-audience': false,
  credentials: {
    jwt: {
      'client-key-password': 'REPLACE WITH THE KEY PASSWORD IN KEYSTORE',
      'client-keystore-file': 'REPLACE WITH THE LOCATION OF YOUR KEYSTORE FILE',
      'client-keystore-password': 'REPLACE WITH THE KEYSTORE PASSWORD',
      'client-key-alias': 'tenant2Client',
      'token-timeout': 10,
      'client-keystore-type': 'jks',
    },
  },
  'confidential-port': 0,
  'policy-enforcer': {},
};

export const tenant2Options = {
  keys: {
    privateKey,
    publicKey,
  },
  enforce: {
    enabled: true,
    resource: {
      name: 'tenant2Resource',
    },
  },
};
