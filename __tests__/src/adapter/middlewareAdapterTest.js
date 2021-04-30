jest.mock('../../../src/keycloakAuthorizer');
jest.mock('../../../src/Jwks');
jest.mock('../../../src/utils/optionsUtils');
jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');
const keycloakAuthorizer = require('../../../src/keycloakAuthorizer');
const optionsUtils = require('../../../src/utils/optionsUtils');

const jwks = require('../../../src/Jwks');

const { middlewareAdapter } = require('../../../src/adapter/middlewareAdapter');

describe('testing middlewareAdapter', () => {
  beforeEach(() => {
    keycloakAuthorizer.adapter.mockImplementation(async () => 'adapter');
    jwks.jwksUrlResponse.mockImplementation(() => 'jwksUrlResponse');
    jwt.decode.mockImplementation(() => {});
    optionsUtils.commonOptions.mockImplementation(() => ({ logger: console }));
  });

  afterEach(() => {
  });

  test('test middlewareAdapter jwks', async () => {
    optionsUtils.commonOptions.mockImplementation(() => ({
      logger: console,
      keys: {
        publicKey: {
          key: 'test',
        },
      },
    }));
    const ma = middlewareAdapter({}, {});
    await ma.middleware({ baseUrl: '/service/jwks' }, {
      json: (message) => {
        expect(message).toEqual('jwksUrlResponse');
      },
    }, {});
  });

  test('test middlewareAdapter', async () => {
    optionsUtils.commonOptions.mockImplementation(() => ({
      logger: console,
    }));
    const ma = middlewareAdapter({}, {});
    await ma.middleware({ headers: { authorization: 'Bearer auth' } }, {
      json: (message) => {
        expect(message).toEqual('jwksUrlResponse');
      },
    }, () => {
      expect(1).toEqual(1);
    });
  });

  test('test middlewareAdapter Error', async () => {
    optionsUtils.commonOptions.mockImplementation(() => ({
      logger: console,
    }));
    keycloakAuthorizer.adapter.mockImplementation(async () => { throw new Error('111'); });
    const ma = middlewareAdapter({}, {});
    await ma.middleware({ headers: { authorization: 'Bearer auth' } }, {
      status: (code) => {
        expect(code).toEqual(403);
        return {
          end: () => {
            expect(1).toEqual(1);
          },
        };
      },
    }, () => {
      throw new Error('Error');
    });
  });

  test('test middlewareAdapter Authorization Error 1', async () => {
    optionsUtils.commonOptions.mockImplementation(() => ({
      logger: console,
    }));
    const ma = middlewareAdapter({}, {});
    await ma.middleware({ headers: { } }, {
      status: (code) => {
        expect(code).toEqual(403);
        return {
          end: () => {
            expect(1).toEqual(1);
          },
        };
      },
    }, () => {
      throw new Error('Error');
    });
  });

  test('test middlewareAdapter Authorization Error 2', async () => {
    optionsUtils.commonOptions.mockImplementation(() => ({
      logger: console,
    }));
    const ma = middlewareAdapter({}, {});
    await ma.middleware({ headers: { authorization: 'test' } }, {
      status: (code) => {
        expect(code).toEqual(403);
        return {
          end: () => {
            expect(1).toEqual(1);
          },
        };
      },
    }, () => {
      throw new Error('Error');
    });
  });
});
