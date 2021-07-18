jest.mock('jsonwebtoken');
jest.mock('get-keycloak-public-key');
jest.mock('../../src/utils/restCalls');
jest.mock('../../src/umaConfiguration');
const jsonwebtoken = require('jsonwebtoken');
const KeyCloakCerts = require('get-keycloak-public-key');

const {getKeycloakUrl} = require('../../src/utils/restCalls');
const keycloakAuthorizer = require('../../src/keycloakAuthorizer');

const cache = {
  get: async () => null,
  put: async () => {},
};

describe('testing keycloakAuthorizer', () => {
  beforeEach(() => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: {
        alg: 'rsa256',
        kid: 'kid',
      },
    }));
    jsonwebtoken.verify.mockImplementation(() => {});
    KeyCloakCerts.mockImplementation(() => ({
      fetch: async () => 'PUBLIC_KEY',
    }));
    getKeycloakUrl.mockImplementation(() => 'http://localhost/auth');
  });

  afterEach(() => {
  });

  test('test adapter without Keycloak.json', async () => {
    try {
      await keycloakAuthorizer.adapter('TOKEN', null, {});
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual('Expected \'keycloakJson\' parameter to be set');
    }
  });

  test('test adapter wrong header', async () => {
    try {
      jsonwebtoken.decode.mockImplementation(() => ({}));
      await keycloakAuthorizer.adapter('TOKEN', {}, {});
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual('invalid token (header part)');
    }
  });

  test('test adapter wrong header none ', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: {
        alg: 'none',
        kid: 'kid',
      },
    }));
    try {
      await keycloakAuthorizer.adapter('TOKEN', {}, {});
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });

  test('test adapter wrong header hs ', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: {
        alg: 'hs256',
        kid: 'kid',
      },
    }));
    try {
      await keycloakAuthorizer.adapter('TOKEN', {}, {});
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });
  test('test adapter wrong header !kid ', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: {
        alg: 'rs256',
        kid: null,
      },
    }));
    try {
      await keycloakAuthorizer.adapter('TOKEN', {}, {});
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });

  test('test adapter  ', async () => {
    const token = await keycloakAuthorizer.adapter('TOKEN', {}, {cache});
    expect(token).toEqual({
      header: {
        alg: 'rsa256',
        kid: 'kid',
      },
      tokenString: 'TOKEN',
    });
  });

  test('test adapter  enforce', async () => {
    const token = await keycloakAuthorizer.adapter('TOKEN', {}, {cache, enforce: {enabled: true}});
    expect(token).toEqual({
      header: {
        alg: 'rsa256',
        kid: 'kid',
      },
      tokenString: 'TOKEN',
    });
  });

  test('test awsAdapter authorizer', async () => {
    const token = await keycloakAuthorizer.awsAdapter({authorizationToken: 'Bearer TOKEN'}, {}, {cache, enforce: {enabled: true}});
    expect(token).toEqual({
      header: {
        alg: 'rsa256',
        kid: 'kid',
      },
      tokenString: 'TOKEN',
    });
  });

  test('test awsAdapter Lambda@Edge', async () => {
    const token = await keycloakAuthorizer.awsAdapter({headers: {Authorization: 'Bearer TOKEN'}}, {}, {cache, enforce: {enabled: true}});
    expect(token).toEqual({
      header: {
        alg: 'rsa256',
        kid: 'kid',
      },
      tokenString: 'TOKEN',
    });
  });

  test('test awsAdapter authorizer wrong token', async () => {
    try {
      const token = await keycloakAuthorizer.awsAdapter({authorizationToken: 'TOKEN'}, {}, {cache, enforce: {enabled: true}});
      expect(token).toEqual({
        header: {
          alg: 'rsa256',
          kid: 'kid',
        },
        tokenString: 'TOKEN',
      });
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual("Invalid Authorization token - 'TOKEN' does not match 'Bearer .*'");
    }
  });

  test('test awsAdapter authorizer without token', async () => {
    try {
      const token = await keycloakAuthorizer.awsAdapter({}, {},
        {cache, enforce: {enabled: true}});
      expect(token).toEqual({
        header: {
          alg: 'rsa256',
          kid: 'kid',
        },
        tokenString: 'TOKEN',
      });
      throw new Error('unexpected');
    } catch (e) {
      expect(e.message).toEqual("Expected 'event.authorizationToken' parameter to be set");
    }
  });
});
