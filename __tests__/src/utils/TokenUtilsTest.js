jest.mock('jsonwebtoken');
jest.mock('../../../src/adapter/adapter');
jest.mock('../../../src/clientAuthorization');

const jwt = require('jsonwebtoken');

const tokenUtils = require('../../../src/utils/TokenUtils');
const {lambdaAdapter} = require('../../../src/adapter/adapter');
const {keycloakRefreshToken} = require('../../../src/clientAuthorization');

const sessionManager = {
  getSessionIfExists: async () => ({}),
  updateSession: async () => ({}),
};

describe('testing TokenUtils', () => {
  beforeEach(() => {
    jwt.decode.mockImplementation(() => ({t: 't'}));
    keycloakRefreshToken.mockImplementation(async () => ({access_token: 'TOKEN'}));
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
    const t = tokenUtils.decodeAccessToken({access_token: 'TOKEN'});
    expect(t).toEqual({
      accessToken: 'TOKEN',
      accessTokenDecode: {
        t: 't',
      },
    });
  });
  test('test tokenIsValid True', async () => {
    lambdaAdapter.mockImplementation(async () => {});
    const t = await tokenUtils.tokenIsValid({access_token: 'TOKEN'}, {});
    expect(t).toEqual(true);
  });

  test('test tokenIsValid False', async () => {
    lambdaAdapter.mockImplementation(async () => { throw new Error(); });
    const t = await tokenUtils.tokenIsValid({access_token: 'TOKEN'}, {});
    expect(t).toEqual(false);
  });
});
