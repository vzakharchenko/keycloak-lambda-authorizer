/* eslint-disable no-empty-function, require-await, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-empty-function
 */
import {decodeToken} from '../utils/TokenUtils';
import {DummyJWKS, DummySecurityAdapter} from "../utils/DummyImplementations.test";

import {DefaultMiddlewareAdapter} from "./MiddlewareAdapter";

jest.mock('../utils/TokenUtils');


describe('MiddlewareAdapter tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    decodeToken.mockImplementation(() => { return {}; });
  });

  test('MiddlewareAdapter test', async () => {
    let next = false;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({securityAdapter: new DummySecurityAdapter()}).middleware()({
      headers: {
        authorization: "Bearer JWT",
      },
    }, {}, () => {
      next = true;
    });
    if (!next) {
      throw new Error('test');
    }
  });

  test('MiddlewareAdapter test 2', async () => {
    let next = false;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      keys: {},
      securityAdapter: new DummySecurityAdapter(),
    }).middleware()({
      headers: {
        authorization: "Bearer JWT",
      },
    }, {}, () => {
      next = true;
    });
    if (!next) {
      throw new Error('test');
    }
  });

  test('MiddlewareAdapter test public key not JWKS', async () => {
    let next = false;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      keys: {publicKey: {key: 'key'}},
      securityAdapter: new DummySecurityAdapter(),
    }).middleware()({
      baseUrl: '/test',
      headers: {
        authorization: "Bearer JWT",
      },
    }, {}, () => {
      next = true;
    });
    if (!next) {
      throw new Error('test');
    }
  });

  test('MiddlewareAdapter test public key not JWKS 2', async () => {
    let next = false;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      keys: {publicKey: {key: 'key'}},
      securityAdapter: new DummySecurityAdapter(),
    }).middleware()({
      originalUrl: '/test',
      headers: {
        authorization: "Bearer JWT",
      },
    }, {}, () => {
      next = true;
    });
    if (!next) {
      throw new Error('test');
    }
  });

  test('MiddlewareAdapter test public key JWKS', async () => {
    let response = null;
    let next = false;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      keys: {publicKey: {key: 'key'}},
      jwks: new DummyJWKS(),
      securityAdapter: new DummySecurityAdapter(),
    }).middleware()({
      originalUrl: '/service/jwks',
      headers: {
        authorization: "Bearer JWT",
      },
    }, {json: (json:any) => {
      response = json;

    }}, () => {
      next = true;
    });
    if (next) {
      throw new Error('test');
    }
    expect(response).toEqual({
      keys: [
        {
          test: "test",
        },
      ],
    });
  });

  test('MiddlewareAdapter test empty authorization', async () => {
    let next = false;
    let status;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      securityAdapter: new DummySecurityAdapter(),
      logger: console,
    }).middleware()({
      originalUrl: '/test',
      headers: {
        authorization: null,
      },
    }, {status: (code:number) => {
      status = code;
      return {
        end: () => {

        },
      };
    }}, () => {
      next = true;
    });
    if (next) {
      throw new Error('test');
    }
    expect(status).toEqual(403);
  });

  test('MiddlewareAdapter test bearer authorization', async () => {
    let next = false;
    let status;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      securityAdapter: new DummySecurityAdapter(),
      logger: console,
    }).middleware()({
      originalUrl: '/test',
      headers: {
        authorization: 'Bearer',
      },
    }, {status: (code:number) => {
      status = code;
      return {
        end: () => {

        },
      };
    }}, () => {
      next = true;
    });
    if (next) {
      throw new Error('test');
    }
    expect(status).toEqual(403);
  });

  test('MiddlewareAdapter test without JWT', async () => {
    let next = false;
    let status;
    // @ts-ignore
    await new DefaultMiddlewareAdapter({
      // @ts-ignore
      securityAdapter: new DummySecurityAdapter(),
      logger: console,
    }).middleware()({
      originalUrl: '/test',
      headers: {
        authorization: 'JWT',
      },
    }, {status: (code:number) => {
      status = code;
      return {
        end: () => {

        },
      };
    }}, () => {
      next = true;
    });
    if (next) {
      throw new Error('test');
    }
    expect(status).toEqual(403);
  });

});
