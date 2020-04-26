jest.mock('axios');

const fetch = require('axios');
const restCalls = require('../../../src/utils/restCalls');

describe('testing restCallTest', () => {
  beforeEach(() => {
    fetch.mockImplementation(async (data) => {
      data.transformResponse('test');
      return { data: JSON.stringify({ response: 'test' }) };
    });
  });

  afterEach(() => {
  });

  test('test fetchData', async () => {
    const response = await restCalls.fetchData('test.com');
    expect(response).toEqual('{"response":"test"}');
  });
  test('test sendData', async () => {
    const response = await restCalls.sendData('test.com');
    expect(response).toEqual('{"response":"test"}');
  });
  test('test getKeycloakUrl 1', async () => {
    const url = await restCalls.getKeycloakUrl({
      'auth-server-url': 'http://localhost:8090/auth',
    });
    expect(url).toEqual('http://localhost:8090/auth');
  });
  test('test getKeycloakUrl 2', async () => {
    const url = await restCalls.getKeycloakUrl({
      'auth-server-url': 'http://localhost:8090/auth/',
    });
    expect(url).toEqual('http://localhost:8090/auth');
  });
});
