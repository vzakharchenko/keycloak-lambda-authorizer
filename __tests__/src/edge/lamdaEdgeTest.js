jest.mock('../../../src/edge/router');
jest.mock('../../../src/edge/lambdaEdgeUtils');
const { getRoute } = require('../../../src/edge/router');

const { updateResponse } = require('../../../src/edge/lambdaEdgeUtils');

const lamdaEdge = require('../../../src/edge/lamdaEdge');

describe('testing lamdaEdge', () => {
  beforeEach(() => {
    getRoute.mockImplementation(async () => ({ handle: async (request, config, f) => { f(null, { response: 'test' }); } }));
    updateResponse.mockImplementation((request, response) => response);
  });

  afterEach(() => {
  });

  test('test lambdaEdgeRouter', async () => {
    await lamdaEdge.lambdaEdgeRouter({
      Records: [{
        cf: { request: {}, config: {} },
      }],
    }, {}, {}, (error, response) => {
      expect(response.response).toEqual('test');
    });
  });

  test('test lambdaEdgeRouter error', async () => {
    getRoute.mockImplementation(() => ({ handle: async () => { throw new Error('test'); } }));
    await lamdaEdge.lambdaEdgeRouter({
      Records: [{
        cf: { request: {}, config: {} },
      }],
    }, {}, {
      sessionOptions: {
        route: {
          internalServerError: (request, callback) => {
            callback(null, { response: 'error' });
          },
        },
      },
    }, (error, response) => {
      expect(response.response).toEqual('error');
    });
  });
  test('test lambdaEdgeRouter error2', async () => {
    getRoute.mockImplementation(async () => ({ handle: async () => { throw new Error('test'); } }));
    await lamdaEdge.lambdaEdgeRouter({ Records: [] }, {}, {
      sessionOptions: {
        route: {
          internalServerError: (request, callback) => {
            callback(null, { response: 'error' });
          },
        },
      },
    }, (error, response) => {
      expect(response.response).toEqual('error');
    });
  });
});
