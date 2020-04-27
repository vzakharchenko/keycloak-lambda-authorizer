jest.mock('cookie');
jest.mock('../../../src/edge/lambdaEdgeUtils');

const cookie = require('cookie');
const cookiesUtils = require('../../../src/utils/cookiesUtils');

describe('testing cookiesUtils', () => {
  beforeEach(() => {
    cookie.parse.mockImplementation(() => ({
      KEYCLOAK_AWS_undefined: 'testSession',
      KEYCLOAK_AWS_SESSION: 'sessionId',
    }));
  });

  afterEach(() => {
  });

  test('test clearCookies', async () => {
    const newResponseHeaders = cookiesUtils.clearCookies({
      headers: {
        cookie: [{
          value: 'testCookie',
        }],
      },
    }, {}, {});
    expect(newResponseHeaders).toEqual({
      'set-cookie': [
        {
          key: 'Set-Cookie',
        },
      ],
    });
  });

  test('test getCookies', async () => {
    const newResponseHeaders = cookiesUtils.getCookies({
      headers: {
        cookie: [{
          value: 'testCookie',
        }],
      },
    }, {}, {});
    expect(newResponseHeaders).toEqual({
      'set-cookie': [
        {
          key: 'Set-Cookie',
        },
        {
          key: 'Set-Cookie',
        },
      ],
    });
  });

  test('test getCookie', async () => {
    const cs = cookiesUtils.getCookie({
      headers: {
        cookie: [{
          value: 'testCookie',
        }],
      },
    });
    expect(cs).toEqual({
      session: 'sessionId',
      sessionToken: 'sessionId',
    });
  });

  test('test getCookie null', async () => {
    const cs = cookiesUtils.getCookie({
      headers: {
      },
    });
    expect(cs).toEqual(null);
  });

  test('test getCookie null 2', async () => {
    cookie.parse.mockImplementation(() => ({
    }));
    const cs = cookiesUtils.getCookie({
      headers: {
        cookie: [{
          value: 'testCookie',
        }],
      },
    });
    expect(cs).toEqual(null);
  });
});
