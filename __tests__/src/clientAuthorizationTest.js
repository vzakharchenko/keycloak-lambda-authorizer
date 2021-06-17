jest.mock('../../src/utils/restCalls');

jest.mock('uuid');
jest.mock('jws');
jest.mock('jsonwebtoken');

const jsonwebtoken = require('jsonwebtoken');
const jws = require('jws');
const restCalls = require('../../src/utils/restCalls');
const clientAuthentication = require('../../src/clientAuthorization');

const cache = {
  get: async () => null,
  put: async () => {},
};

const keycloakJsonWithSecret = () => ({
  realm: 'lambda-authorizer',
  'auth-server-url': 'http://localhost:8090/auth',
  'ssl-required': 'external',
  resource: 'lambda',
  'verify-token-audience': true,
  credentials: {
    secret: '772decbe-0151-4b08-8171-bec6d097293b',
  },
  'confidential-port': 0,
  'policy-enforcer': {},
});

const keycloakJsonWithJWS = () => ({
  realm: 'lambda-authorizer',
  'auth-server-url': 'http://localhost:8090/auth',
  'ssl-required': 'external',
  resource: 'lambda-jwks',
  'verify-token-audience': true,
  credentials: {
  },
  'use-resource-role-mappings': true,
  'confidential-port': 0,
  'policy-enforcer': {},
});

describe('testing clientAuthorization', () => {
  beforeEach(() => {
    restCalls.fetchData.mockImplementation(async (url) => {
      if (url === '') {
        return JSON.stringify({});
      }
      throw new Error(`unexpected Url: ${url}`);
    });
    restCalls.sendData.mockImplementation(async (url, method, data) => {
      if (url === 'token_endpoint') {
        if (data === 'grant_type=client_credentials&client_id=lambda&client_secret=772decbe-0151-4b08-8171-bec6d097293b') {
          return JSON.stringify({ access_token: 'access_token' });
        }
        if (data === 'grant_type=client_credentials&client_id=lambda-jwks&client_assertion=jwsSignature') {
          return JSON.stringify({ access_token: 'access_token_jws' });
        }
        if (data === 'refresh_token=refresh_token&grant_type=refresh_token&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=lambda&client_secret=772decbe-0151-4b08-8171-bec6d097293b') {
          return JSON.stringify({ access_token: 'access_token_refresh' });
        }
        throw new Error(`unexpected token data: ${data}`);
      }
      if (url === 'http://localhost:8090/auth/realms/lambda-authorizer/protocol/openid-connect/logout') {
        return JSON.stringify({});
      }

      if (url === 'http://localhost:8090/auth/realms/lambda-authorizer/protocol/openid-connect/token') {
        if (data === 'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience=lambda') {
          return JSON.stringify({ access_token: 'access_token_uma' });
        }
        if (data === 'grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience=test') {
          return JSON.stringify({ access_token: 'access_token_uma' });
        }
        if (data === 'code=code&grant_type=authorization_code&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=lambda&client_secret=772decbe-0151-4b08-8171-bec6d097293b&redirect_uri=host%2Flambda-authorizer%2Flambda%2Fcallback') {
          return JSON.stringify({ access_token: 'access_token_code' });
        }
        if (data === 'refresh_token=refresh_token&grant_type=refresh_token&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=lambda&client_secret=772decbe-0151-4b08-8171-bec6d097293b') {
          return JSON.stringify({ access_token: 'access_token_refresh' });
        }
        throw new Error(`unexpected token data: ${data}`);
      }
      throw new Error(`unexpected Url: ${url}`);
    });

    restCalls.getKeycloakUrl.mockImplementation(() => 'http://localhost:8090/auth');
    jws.createSign.mockImplementation(() => ({
      on: (d, f) => {
        f('jwsSignature');
      },
    }));
    jsonwebtoken.decode.mockImplementation((token) => {
      if (token === 'access_token') {
        return {
          exp: 1,
        };
      }
      return {
        exp: Number.MAX_SAFE_INTEGER,
      };
    });
  });

  afterEach(() => {
  });

  test('test clientAuthorization secret success', async () => {
    await clientAuthentication.clientAuthentication({ token_endpoint: 'token_endpoint' }, {
      keycloakJson: keycloakJsonWithSecret,
      cache,
    });
  });
  test('test clientAuthorization jws Unsupported Credential Type', async () => {
    try {
      await clientAuthentication.clientAuthentication({ token_endpoint: 'token_endpoint' }, {
        keycloakJson: keycloakJsonWithJWS,
        cache,
      });
    } catch (e) {
      expect(e.message).toEqual('Unsupported Credential Type');
    }
  });

  test('test clientAuthorization jws success', async () => {
    await clientAuthentication.clientAuthentication({ token_endpoint: 'token_endpoint' }, {
      keys: {
        privateKey: {
          key: 'PRIVATE_KEY',
          passphrase: 'password',
        },
      },
      keycloakJson: keycloakJsonWithJWS,
      cache,
    });
  });

  test('test clientAuthorization  success withCache', async () => {
    await clientAuthentication.clientAuthentication({ token_endpoint: 'token_endpoint' }, {
      keycloakJson: keycloakJsonWithSecret,
      cache: {
        get: async () => JSON.stringify({ decodedAccessToken: { exp: 1 }, refresh_token: 'refresh_token', decodedRefreshToken: { exp: Number.MAX_SAFE_INTEGER } }),
        put: async () => {
        },
      },
    });
  });

  test('test logout', async () => {
    await clientAuthentication.logout('refreshToken', {
      keycloakJson: keycloakJsonWithSecret,
      cache,
    });
  });

  test('test exchangeRPT', async () => {
    const token = await clientAuthentication.exchangeRPT('accessToken', 'lambda', {
      keycloakJson: keycloakJsonWithSecret,
      cache,
    });
    expect(token.access_token).toEqual('access_token_uma');
  });

  test('test clientJWT', async () => {
    const signature = await clientAuthentication.clientJWT({ data: 'test' }, {
      keys: {
        privateKey: {
          key: 'PRIVATE_KEY',
          passphrase: 'password',
        },
      },
      keycloakJson: keycloakJsonWithSecret,
      cache,
    });
    expect(signature).toEqual('jwsSignature');
  });

  test('test getTokenByCode', async () => {
    const token = await clientAuthentication.getTokenByCode('code', 'host', {
      keycloakJson: keycloakJsonWithSecret,
      cache,
    });
    expect(token.access_token).toEqual('access_token_code');
  });

  test('test keycloakRefreshToken with enforcer', async () => {
    const token = await clientAuthentication.keycloakRefreshToken({ access_token: 'access_token', refresh_token: 'refresh_token' }, {
      keycloakJson: keycloakJsonWithSecret,
      cache,
      logger: console,
      enforce: {
        enabled: true,
        resource: {
          resource: 'testResource',
        },
      },
    });
    expect(token.access_token).toEqual('access_token_uma');
  });

  test('test keycloakRefreshToken with enforcer custom clientId', async () => {
    const token = await clientAuthentication.keycloakRefreshToken({ access_token: 'access_token', refresh_token: 'refresh_token' }, {
      keycloakJson: keycloakJsonWithSecret,
      cache,
      logger: console,
      clientId: 'test',
      enforce: {
        enabled: true,
        resource: {
          resource: 'testResource',
        },
      },
    });
    expect(token.access_token).toEqual('access_token_uma');
  });

  test('test keycloakRefreshToken without enforcer', async () => {
    const token = await clientAuthentication.keycloakRefreshToken({ access_token: 'access_token', refresh_token: 'refresh_token' }, {
      keycloakJson: keycloakJsonWithSecret,
      cache,
      logger: console,
      enforce: {
        enabled: false,
      },
    });
    expect(token.access_token).toEqual('access_token_refresh');
  });
  test('test getRPT', async () => {
    const token = await clientAuthentication.getRPT({}, {
      payload: {
        jti: '1',
      },
    },
    'lambda',
    {
      keycloakJson: keycloakJsonWithSecret,
      cache,
      logger: console,
      enforce: {
        enabled: true,
        resource: {
          resource: 'testResource',
        },
      },
    });
    expect(token.access_token).toEqual('access_token_uma');
  });
});
