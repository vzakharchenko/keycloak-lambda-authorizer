import { privateKey, publicKey } from './sessionKeys';

export const portalKeycloakJSON = {
  realm: 'portal',
  'auth-server-url': 'http://127.0.0.1:8080/auth/',
  'ssl-required': 'external',
  resource: 'portal-ui',
  credentials: {
    secret: 'ece2012c-fc01-4dca-b50b-f898c9c6c811',
  },
  'confidential-port': 0,
};

function getRealmCallback(uri) {
  return uri && uri.includes('/securityRealmClient') ? uri.split('/')[uri.split('/').length - 3] : null;
}

function getRealm(options) {
  const { uri } = options.request;
  return uri && uri.startsWith('/tenants') ? uri.split('/')[2] : getRealmCallback(uri);
}

export function tenantKeycloakJson(options) {
  return {
    realm: getRealm(options),
    'auth-server-url': 'http://localhost:8080/auth',
    'ssl-required': 'external',
    resource: 'securityRealmClient',
    credentials: {
      jwt: {
      },
    },
    'confidential-port': 0,
  };
}

export const tenantOptions = {
  keys: {
    privateKey,
    publicKey,
  },
  sessionModify: (sessionToken, token, options) => {
    const keycloakJson = options.keycloakJson(options);
    const newSessionToken = { ...sessionToken };
    Object.keys(newSessionToken.tenants).forEach((realm) => {
      Object.keys(newSessionToken.tenants[realm]).forEach((clientId) => {
        newSessionToken.tenants[realm][clientId].status = realm === keycloakJson.realm && clientId === keycloakJson.resource ? 'Active' : 'InActive';
      });
    });
    return newSessionToken;
  },
  enforce: {
    enabled: true,
    resource: {
      name: 'securityRealmResource',
    },
  },
};
