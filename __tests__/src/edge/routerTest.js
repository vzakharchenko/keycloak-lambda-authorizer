jest.mock('yallist');
const yallist = require('yallist');

yallist.create.mockImplementation(() => ({
  toArray: () => [{ name: 'test', isRoute: () => true }],
  push: () => {
  },

}));
const router = require('../../../src/edge/router');

describe('testing edgeRouter', () => {
  beforeEach(() => {

  });

  afterEach(() => {
  });

  test('test registerRoute/getRouter', async () => {
    router.registerRoute({});
    const route = await router.getRoute({}, {});
    expect(route.name).toEqual('test');
  });
});
