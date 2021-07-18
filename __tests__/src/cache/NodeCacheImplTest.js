const {get, put} = require('../../../src/cache/NodeCacheImpl');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

describe('testing NodeCacheImpl', () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  test('test put/get regions', async () => {
    await put('publicKey', 'test1', 'test1Value');
    await put('uma2-configuration', 'test', 'test1Value');
    await put('client_credentials', 'test', 'test1Value');
    await put('rpt', 'testRPT', 'testRPTValue', 2);
    await put('resource', 'test', 'test2Value');
    try {
      await put('testRegion', 'test', 'testValue');
      throw new Error('unexpected state');
    } catch (e) {
      expect(e.message).toEqual('Unsupported Region');
    }
    expect(await get('publicKey', 'test1')).toEqual('test1Value');
    expect(await get('uma2-configuration', 'test')).toEqual('test1Value');
    expect(await get('client_credentials', 'test')).toEqual('test1Value');
    expect(await get('resource', 'test')).toEqual('test2Value');
    expect(await get('rpt', 'testRPT')).toEqual('testRPTValue');
    try {
      await get('testRegion', 'test');
      throw new Error('unexpected state');
    } catch (e) {
      expect(e.message).toEqual('Unsupported Region');
    }
    await delay(2000);
    expect(await get('rpt', 'testRPT')).toBeUndefined();
  });
});
