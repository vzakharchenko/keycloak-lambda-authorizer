jest.mock('../../../src/clientAuthorization');
jest.mock('jsonwebtoken');

const jsonwebtoken = require('jsonwebtoken');
const { clientJWT } = require('../../../src/clientAuthorization');
const {
  signState,
  validateState,
  tenantName,
  updateResponse,
  getHostUrl,
} = require('../../../src/edge/lambdaEdgeUtils');

describe('testing lambdaEdgeUtils', () => {
  beforeEach(() => {
    clientJWT.mockImplementation(async () => 'signature');
    jsonwebtoken.decode.mockImplementation(() => ({
      header: { alg: 'rs256' },
    }));
    jsonwebtoken.verify.mockImplementation(() => ({
      n: 'undefined-undefined',
    }));
  });

  afterEach(() => {
  });

  test('test signState', async () => {
    const ret = await signState('/', {
      logger: console,
      keycloakJson: {},
      sessionManager:
            { sessionOptions: { sessionOptions: {} } },
    });
    expect(ret).toEqual('signature');
  });

  test('test validateState', async () => {
    const ret = await validateState('Token', {
      logger: console,
      keycloakJson: {},
      sessionManager: {
        sessionOptions: { keys: { publicKey: { key: 'PUBLIC_KEY' } } },
      },
    });
    expect(ret).toEqual({ n: 'undefined-undefined' });
  });

  test('test validateState none', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: { alg: 'none' },
    }));
    try {
      await validateState('Token', {
        logger: console,
        keycloakJson: {},
        sessionManager: {
          sessionOptions: { keys: { publicKey: { key: 'PUBLIC_KEY' } } },
        },
      });
      throw new Error('Unexpected state');
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });

  test('test validateState invalid token', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
    }));
    try {
      await validateState('Token', {
        logger: console,
        keycloakJson: {},
        sessionManager: {
          sessionOptions: { keys: { publicKey: { key: 'PUBLIC_KEY' } } },
        },
      });
      throw new Error('Unexpected state');
    } catch (e) {
      expect(e.message).toEqual('invalid token (header part)');
    }
  });

  test('test validateState invalid token 3', async () => {
    const newVar = await validateState(null, {
      logger: console,
      keycloakJson: {},
      sessionManager: {
        sessionOptions: { keys: { publicKey: { key: 'PUBLIC_KEY' } } },
      },
    });
    expect(newVar).toEqual(null);
  });

  test('test validateState invalid token 2', async () => {
    jsonwebtoken.decode.mockImplementation(() => null);
    try {
      await validateState('Token', {
        logger: console,
        keycloakJson: {},
        sessionManager: {
          sessionOptions: { keys: { publicKey: { key: 'PUBLIC_KEY' } } },
        },
      });
      throw new Error('Unexpected state');
    } catch (e) {
      expect(e.message).toEqual('invalid token (header part)');
    }
  });

  test('test validateState hs', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: { alg: 'hs64' },
    }));
    try {
      await validateState('Token', {
        logger: console,
        keycloakJson: {},
        sessionManager: {
          sessionOptions: { keys: { publicKey: { key: 'PUBLIC_KEY' } } },
        },
      });
      throw new Error('Unexpected state');
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });

  test('test tenantName', async () => {
    const tn = tenantName({ realm: 'name', resource: 'resource' });
    expect(tn).toEqual('name-resource');
  });

  test('test getHostUrl', async () => {
    const request = { headers: { referer: [{ value: 'https:/test.com' }] } };
    const url = getHostUrl(request);
    expect(url).toEqual('https:/test.com');
  });

  test('updateResponse test empty', async () => {
    const request = {};
    const response = {};
    updateResponse(request, response);
    expect(response).toEqual({});
  });

  test('updateResponse test', async () => {
    const request = {};
    const response = {
      headers: {
        'set-cookie': [{ value: 'test' }],
      },
    };
    updateResponse(request, response);
    expect(response).toEqual({
      headers: {
        'set-cookie': [
          {
            value: 'test',
          },
        ],
      },
    });
  });
  test('updateResponse test 2', async () => {
    const request = { headers: { referer: [{ value: 'https:/test.com' }] } };
    const response = {
      headers: {
        'set-cookie': [{ value: 'test' }],
      },
    };
    updateResponse(request, response);
    expect(response).toEqual({
      headers: {
        'set-cookie': [
          {
            value: 'test; Domain=https:/test.com; Secure',
          },
        ],
      },
    });
  });
});
