/* eslint-disable require-await, babel/camelcase, @typescript-eslint/ban-ts-comment, no-empty-function, @typescript-eslint/no-empty-function
 */
// @ts-ignore
import KeyCloakCerts from 'get-keycloak-public-key';
import jsonwebtoken from 'jsonwebtoken';

import {AdapterCache} from "../cache/AdapterCache";
import {RequestContent} from "../Options";

import {decodeToken, isExpired, transformRequestToRefresh, transformResfreshToRequest, verifyToken} from "./TokenUtils";
import {DummyCache} from "./DummyImplementations.test";
// import keycloakUtils from './KeycloakUtils';

jest.mock('get-keycloak-public-key', () => jest.fn(() => ({fetch: async () => {}})));
jest.mock('./KeycloakUtils', () => ({getKeycloakUrl: jest.fn(() => 'http://url.com'), getUrl: jest.fn(() => 'http://url.com')}));
let verifyError = false;
// @ts-ignore
let decodeTokenJson;
// @ts-ignore
jest.mock('jsonwebtoken', () => ({verify: jest.fn(() => {
  if (verifyError) {
    throw new Error("111");
  } else {
    return true;
  }
}),
  decode: jest.fn(() => {
    // @ts-ignore
    return decodeTokenJson;
  })}));

let cache: AdapterCache;

describe('TokenUtils tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    cache = new DummyCache();
    verifyError = false;
    decodeTokenJson = {
      header: {
        alg: 'rsa',
        kid: '1',
      },
    };
    // @ts-ignore
  });

  test('test isExpired', async () => {
    expect(isExpired({exp: Math.floor(Date.now() / 1000) + 100})).toEqual(false);
  });
  test('test isExpired', async () => {
    expect(isExpired({exp: 1})).toEqual(true);
  });

  test('test verifyToken', async () => {

    // @ts-ignore
    const jwtToken = await verifyToken({
      token: {
        header: {alg: 'rsa', kid: '1'}, payload: {}, tokenString: 'token'},
      tokenString: "token",
          // @ts-ignore
    }, {cache,
      // @ts-ignore
      keycloakJson: async (arg1:AdapterCache, arg2:RequestContent) => { return {}; },
      logger: console});
    expect(jwtToken).toEqual({
      header: {
        alg: "rsa",
        kid: "1",
      },
      payload: {},
      tokenString: "token",
    });
  });

  test('test verifyToken error1', async () => {
    let error = false;
    try {
      await verifyToken({
        token: {
          header: {alg: 'hs256', kid: '1'}, payload: {}, tokenString: 'token'},
        tokenString: "token",
        // @ts-ignore
      }, {cache, logger: console});
    } catch (e:any) {
      expect(e.message).toEqual('invalid token');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('test verifyToken error2', async () => {
    let error = false;
    cache = new DummyCache("key");
    try {
      verifyError = true;
      // @ts-ignore
      await verifyToken({
        token: {
          header: {alg: 'rsa', kid: '1'}, payload: {}, tokenString: 'token'},
        tokenString: "token",
        // @ts-ignore
      }, {cache, logger: console});
    } catch (e:any) {
      expect(e.message).toEqual('invalid token: Error: 111');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('test verifyToken Cache ', async () => {
    cache = new DummyCache("key");
    const jwtToken = await verifyToken({
      token: {
        header: {alg: 'rsa', kid: '1'}, payload: {}, tokenString: 'token'},
      tokenString: "token",
      // @ts-ignore
    }, {cache, logger: console});
    expect(jwtToken).toEqual({
      header: {
        alg: "rsa",
        kid: "1",
      },
      payload: {},
      tokenString: "token",
    });
  });

  test('test decodetoken ', async () => {
    const token = decodeToken("token");
    expect(token).toEqual({
      header: {
        alg: "rsa",
        kid: "1",
      },
      tokenString: "token",
    });
  });
  test('test transformResfreshToRequest ', async () => {

    const token = transformResfreshToRequest(
        // @ts-ignore
        {token: {access_token: 'token'}},
);

    expect(token).toEqual({
      token: {
        header: {
          alg: "rsa",
          kid: "1",
        },
        tokenString: "token",
      },
      tokenString: "token",
    });
  });

  test('test transformRequestToRefresh ', async () => {

    const token = transformRequestToRefresh(
        // @ts-ignore
        {token: {access_token: 'token'}},
        {},
);
    expect(token).toEqual({
      token: {
        token: {
          access_token: "token",
        },
      },
    });
  });

  test('test decodetoken error1', async () => {
    let error = false;
    try {
      decodeTokenJson = null;
      decodeToken("token");
    } catch (e:any) {
      expect(e.message).toEqual('invalid token (header part)');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('test decodetoken error2', async () => {
    let error = false;
    try {
      decodeTokenJson = {header: null};
      decodeToken("token");
    } catch (e:any) {
      expect(e.message).toEqual('invalid token (header part)');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('test decodetoken error3', async () => {
    let error = false;
    try {
      decodeTokenJson = {header: {alg: 'none'}};
      decodeToken("token");
    } catch (e:any) {
      expect(e.message).toEqual('invalid token');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('test decodetoken error4', async () => {
    let error = false;
    try {
      decodeTokenJson = {header: {alg: 'rsa', kid: null}};
      decodeToken("token");
    } catch (e:any) {
      // @ts-ignore
      expect(e.message).toEqual('invalid token');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

});
