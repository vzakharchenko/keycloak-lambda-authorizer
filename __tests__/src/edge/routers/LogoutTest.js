jest.mock('cookie');
jest.mock('querystring');
jest.mock('../../../../src/edge/lambdaEdgeUtils');
jest.mock('../../../../src/utils/restCalls');
const qs = require('querystring');
const { tenantLogout } = require('../../../../src/edge/routes/Logout');

describe('testing logout', () => {
  beforeEach(() => {
    qs.parse.mockImplementation(() => ({ url: '/url' }));
  });

  afterEach(() => {
  });

  test('test tenantLogout', async () => {
    const ret = await tenantLogout({}, { keycloakJson: () => ({ realm: 'name', resource: 'resource' }) });
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
        ],
      },
      status: '302',
      statusDescription: 'Found',
    });
  });
});
