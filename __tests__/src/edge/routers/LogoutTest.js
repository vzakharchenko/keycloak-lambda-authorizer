jest.mock('cookie');
jest.mock('querystring');
jest.mock('../../../../src/edge/lambdaEdgeUtils');
jest.mock('../../../../src/utils/restCalls');
jest.mock('../../../../src/utils/TokenUtils');
jest.mock('../../../../src/utils/cookiesUtils');

const qs = require('querystring');
const { tenantLogout } = require('../../../../src/edge/routes/Logout');
const cookiesUtils = require('../../../../src/utils/cookiesUtils');
const { decodeAccessToken } = require('../../../../src/utils/TokenUtils');

const sessionManager = {
  checkSession: async () => true,
  deleteTenantSession: async () => ({}),
  updateSessionToken: async () => 'SESSION_JWT',
};

describe('testing logout', () => {
  beforeEach(() => {
    qs.parse.mockImplementation(() => ({ url: '/url' }));
    decodeAccessToken.mockImplementation(() => ({ accessToken: 'TOKEN', accessTokenDecode: { email: 'test@test', exp: 1000 } }));
    cookiesUtils.getCookie.mockImplementation(() => ({
      session: 's',
      sessionToken: 'Session_TOKEN',
    }));
  });

  afterEach(() => {
  });

  test('test tenantLogout', async () => {
    const ret = await tenantLogout({}, {
      sessionManager,
      keycloakJson: () => ({ realm: 'name', resource: 'resource' }),
    });
    expect(ret).toEqual({
      body: 'Redirect to logout page',
      headers: {
        location: [
          {
            key: 'Location',
            value: 'undefined/realms/name/protocol/openid-connect/logout?redirect_uri=/url',
          },
        ],
        'set-cookie': [
          {
            key: 'Set-Cookie',
          },
          {
            key: 'Set-Cookie',
          },
          {
            key: 'Set-Cookie',
          },
        ],
      },
      status: '302',
      statusDescription: 'Found',
    });
  });
});
