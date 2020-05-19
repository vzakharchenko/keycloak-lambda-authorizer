jest.mock('../../../../src/edge/router');
jest.mock('../../../../src/adapter/adapter');
jest.mock('../../../../src/edge/routes/Logout');
jest.mock('../../../../src/edge/routes/Callback');
jest.mock('../../../../src/edge/routes/utils/redirectAuthServer');
const { registerRoute } = require('../../../../src/edge/router');
const { jwksUrl } = require('../../../../src/adapter/adapter');
const routes = require('../../../../src/edge/routes/routes');
const { tenantLogout } = require('../../../../src/edge/routes/Logout');
const { callbackHandler } = require('../../../../src/edge/routes/Callback');
const { checkToken, refreshResponse } = require('../../../../src/edge/routes/utils/redirectAuthServer');

const routers = {
};

describe('testing routers', () => {
  beforeEach(() => {
    registerRoute.mockImplementation(() => {});
    jwksUrl.mockImplementation(() => 'jwks response');
    tenantLogout.mockImplementation(async () => ({
      status: '302',
      statusDescription: 'Found',
    }));

    callbackHandler.mockImplementation(async () => ({
      status: '302',
      statusDescription: 'Found',
    }));
    checkToken.mockImplementation(async () => ({
      status: '302',
      statusDescription: 'Found',
    }));
    refreshResponse.mockImplementation((r) => r);
  });

  afterEach(() => {
  });

  test('test addRoute', () => {
    routes.addRoute({});
  });
  test('test isRequest', async () => {
    expect(await routes.isRequest({ uri: 't' }, 't')).toEqual(true);
    expect(await routes.isRequest({ uri: 't' }, 'f')).toEqual(false);
  });

  test('test unProtected', async () => {
    routers.unProtected = [];
    registerRoute.mockImplementation((route) => {
      routers.unProtected.push(route);
    });
    routes.addUnProtected('/test');
    const route = routers.unProtected[0];
    expect(await route.isRoute({ uri: '/t' })).toEqual(false);
    expect(await route.isRoute({ uri: '/test' })).toEqual(true);
    await route.handle({}, {}, (error, response) => {
      expect(response).toEqual({});
    });
  });

  test('test unProtected Regexp', async () => {
    routers.unProtected = [];
    registerRoute.mockImplementation((route) => {
      routers.unProtected.push(route);
    });
    routes.addUnProtected(new RegExp('(^)(\\/)(test)(/$|(\\?|$))', 'g'));
    const route = routers.unProtected[0];
    expect(await route.isRoute({ uri: '/t' })).toEqual(false);
    expect(await route.isRoute({ uri: '/test' })).toEqual(true);
    expect(await route.isRoute({ uri: '/test/' })).toEqual(true);
    expect(await route.isRoute({ uri: '/test/fdfd' })).toEqual(false);
    expect(await route.isRoute({ uri: '/test?test=kk' })).toEqual(true);
    await route.handle({}, {}, (error, response) => {
      expect(response).toEqual({});
    });
  });

  test('test JWKS', async () => {
    routers.jwks = [];
    registerRoute.mockImplementation((route) => {
      routers.jwks.push(route);
    });
    routes.addJwksEndpoint('/test', 'publicKey');
    const route = routers.jwks[0];
    expect(await route.isRoute({ uri: '/test' })).toEqual(true);
    await route.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        body: 'jwks response',
        status: '200',
      });
    });
  });

  test('test Protected keycloak JSON', async () => {
    routers.protected = [];
    registerRoute.mockImplementation((route) => {
      routers.protected.push(route);
    });
    routes.addProtected('/', () => ({ realm: 'realm', resource: 'resource' }));
    const routeLogout = routers.protected[0];
    expect(await routeLogout.isRoute({ uri: '/realm/resource/logout' })).toEqual(true);
    await routeLogout.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
      });
    });

    const routeCallback = routers.protected[1];
    expect(await routeCallback.isRoute({ uri: '/realm/resource/callback' })).toEqual(true);
    await routeCallback.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
      });
    });


    const routeRefresh = routers.protected[2];
    expect(await routeRefresh.isRoute({ uri: '/realm/resource/refresh' })).toEqual(true);
    await routeRefresh.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
      });
    });
    const route = routers.protected[3];
    expect(await route.isRoute({ uri: '/' })).toEqual(true);
    expect(await route.isRoute({ uri: '/test' })).toEqual(true);
    expect(await route.isRoute({ uri: '/test/333' })).toEqual(true);
    await route.handle({ r: 'r' }, {}, (error, response) => {
      expect(response).toEqual({ r: 'r' });
    });
  });

  test('test Protected', async () => {
    routers.protected = [];
    registerRoute.mockImplementation((route) => {
      routers.protected.push(route);
    });
    routes.addProtected('/', { realm: 'realm', resource: 'resource' });
    const routeLogout = routers.protected[0];
    expect(await routeLogout.isRoute({ uri: '/realm/resource/logout' })).toEqual(true);
    await routeLogout.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
      });
    });

    const routeCallback = routers.protected[1];
    expect(await routeCallback.isRoute({ uri: '/realm/resource/callback' })).toEqual(true);
    await routeCallback.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
      });
    });


    const routeRefresh = routers.protected[2];
    expect(await routeRefresh.isRoute({ uri: '/realm/resource/refresh' })).toEqual(true);
    await routeRefresh.handle({}, {}, (error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
      });
    });
    const route = routers.protected[3];
    expect(await route.isRoute({ uri: '/' })).toEqual(true);
    expect(await route.isRoute({ uri: '/test' })).toEqual(true);
    expect(await route.isRoute({ uri: '/test/333' })).toEqual(true);
    await route.handle({ r: 'r' }, {}, (error, response) => {
      expect(response).toEqual({ r: 'r' });
    });
  });
});
