jest.mock('jsonwebtoken');
jest.mock('../../../src/adapter/adapter');
jest.mock('../../../src/clientAuthorization');
jest.mock('../../../src/edge/lambdaEdgeUtils');

const jwt = require('jsonwebtoken');
const tokenUtils = require('../../../src/utils/TokenUtils');
const { lambdaAdapter } = require('../../../src/adapter/adapter');
const { keycloakRefreshToken } = require('../../../src/clientAuthorization');

const sessionManager = {
  getSessionIfExists: async () => ({}),
  updateSession: async () => ({}),
};

describe('testing TokenUtils', () => {
  beforeEach(() => {
    jwt.decode.mockImplementation(() => ({ t: 't' }));
    keycloakRefreshToken.mockImplementation(async () => ({ access_token: 'TOKEN' }));
  });

  afterEach(() => {
  });

  test('test decodeAccessToken', async () => {
    const t = tokenUtils.decodeAccessToken('TOKEN');
    expect(t).toEqual({
      accessToken: 'TOKEN',
      accessTokenDecode: {
        t: 't',
      },
    });
  });

  test('test decodeAccessToken access_token', () => {
    const t = tokenUtils.decodeAccessToken({ access_token: 'TOKEN' });
    expect(t).toEqual({
      accessToken: 'TOKEN',
      accessTokenDecode: {
        t: 't',
      },
    });
  });
  test('test tokenIsValid True', async () => {
    lambdaAdapter.mockImplementation(async () => {});
    const t = await tokenUtils.tokenIsValid({ access_token: 'TOKEN' }, {});
    expect(t).toEqual(true);
  });

  test('test tokenIsValid False', async () => {
    lambdaAdapter.mockImplementation(async () => { throw new Error(); });
    const t = await tokenUtils.tokenIsValid({ access_token: 'TOKEN' }, {});
    expect(t).toEqual(false);
  });


  test('test tokenIsValid still active', async () => {
    lambdaAdapter.mockImplementation(async () => {});
    const t = await tokenUtils.getActiveToken('SESSION', { access_token: 'TOKEN' }, {});
    expect(t).toEqual({ access_token: 'TOKEN' });
  });

  test('test tokenIsValid not active and session expired', async () => {
    lambdaAdapter.mockImplementation(async () => { throw new Error(); });
    const t = await tokenUtils.getActiveToken('SESSION', { access_token: 'TOKEN' },
      {
        logger: console,
        sessionManager: {
          getSessionIfExists: async () => null,
        },
      });
    expect(t).toEqual(null);
  });

  test('test tokenIsValid not active, refresh token expired', async () => {
    lambdaAdapter.mockImplementation(async () => { throw new Error(); });
    keycloakRefreshToken.mockImplementation(async () => null);
    const t = await tokenUtils.getActiveToken('SESSION', { access_token: 'TOKEN' },
      {
        logger: console,
        sessionManager,
        keycloakJson: () => {},
      });
    expect(t).toEqual(null);
  });

  test('test tokenIsValid not active, error', async () => {
    lambdaAdapter.mockImplementation(async () => { throw new Error(); });
    keycloakRefreshToken.mockImplementation(async () => {
      throw new Error('test');
    });
    try {
      await tokenUtils.getActiveToken('SESSION', { access_token: 'TOKEN' },
        {
          logger: console,
          sessionManager,
          keycloakJson: () => {},
        });
      throw new Error('Unexpected state');
    } catch (e) {
      expect(e.message).toEqual('Error: test');
    }
  });

  test('test tokenIsValid not active', async () => {
    lambdaAdapter.mockImplementation(async () => { throw new Error(); });
    const t = await tokenUtils.getActiveToken('SESSION', { access_token: 'TOKEN' },
      {
        logger: console,
        sessionManager,
        keycloakJson: () => {},
      });
    expect(t).toEqual('TOKEN');
  });
});
