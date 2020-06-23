jest.mock('../../../src/keycloakAuthorizer');

const keycloakAuthorizer = require('../../../src/keycloakAuthorizer');

const { awsAdapter } = require('../../../src/apigateway/apigateway');

describe('testing apigateway', () => {
  beforeEach(() => {
    keycloakAuthorizer.awsAdapter.mockImplementation(async () => 'awsAdapter');
  });

  afterEach(() => {
  });

  test('test apigateway adapter', async () => {
    const resp = await awsAdapter('token', {}, {});
    expect(resp).toEqual('awsAdapter');
  });
});
