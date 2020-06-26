import { privateKey, publicKey } from './sessionKeys';

export const tenant1KeycloakJson = {
  realm: 'tenant1',
  'auth-server-url': 'http://localhost:8090/auth/',
  'ssl-required': 'external',
  resource: 'tenant1Client',
  'verify-token-audience': true,
  credentials: {
    secret: '27a2a2e2-bbe2-4949-8a24-111084a4e3ee',
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
  realm: 'Tenant2',
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
