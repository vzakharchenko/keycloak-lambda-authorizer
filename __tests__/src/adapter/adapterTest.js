
jest.mock('../../../src/keycloakAuthorizer');
jest.mock('../../../src/jwks');
const keycloakAuthorizer = require('../../../src/keycloakAuthorizer');
// eslint-disable-next-line import/no-unresolved
const jwks = require('../../../src/jwks');

const { lambdaAdapter, jwksUrl } = require('../../../src/adapter/adapter');

describe('testing adapter', () => {
  beforeEach(() => {
    keycloakAuthorizer.adapter.mockImplementation(async () => 'adapter');
    jwks.jwksUrlResponse.mockImplementation(() => 'jwksUrlResponse');
  });

  afterEach(() => {
  });

  test('test lambdaAdapter', async () => {
    const resp = await lambdaAdapter('token', {}, {});
    expect(resp).toEqual('adapter');
  });

  test('test jwksUrl', () => {
    const resp = jwksUrl('publicKey');
    expect(resp).toEqual('jwksUrlResponse');
  });
});
