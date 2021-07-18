jest.mock('../../src/umaConfiguration');
jest.mock('../../src/clientAuthorization');
jest.mock('../../src/utils/optionsUtils');

const {clientAuthentication} = require('../../src/clientAuthorization');
const {serviceAccountJWT} = require('../../src/serviceAccount');

const keycloakJson = () => ({
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

describe('testing umaConfiguration', () => {
  beforeEach(() => {
    clientAuthentication.mockImplementation(async () => ({access_token: 'access_token'}));
  });

  afterEach(() => {
  });

  test('test serviceAccountJWT with keycloakJson', async () => {
    const token = await serviceAccountJWT(keycloakJson);
    expect(token).toEqual('access_token');
  });

  test('test serviceAccountJWT with options', async () => {
    const token = await serviceAccountJWT(null, {keycloakJson});
    expect(token).toEqual('access_token');
  });
});
