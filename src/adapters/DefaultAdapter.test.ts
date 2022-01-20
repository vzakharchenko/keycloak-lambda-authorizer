/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */
import {decodeToken, verifyToken} from '../utils/TokenUtils';
import {RequestContent} from "../Options";
import {DummyClientAuthorization, DummyEnforcerAction} from "../utils/DummyImplementations.test";

import {DefaultAdapter} from "./DefaultAdapter";

jest.mock('../utils/TokenUtils');

describe('DefaultAdapter tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    decodeToken.mockImplementation(() => { return {}; });
    // @ts-ignore
    verifyToken.mockImplementation((req:RequestContent) => (req));
  });

  test('validate test string', async () => {
    // @ts-ignore
    const ret = await new DefaultAdapter({}).validate("token");
    expect(ret).toEqual({
      token: {},
      tokenString: "token",
    });
  });

  test('validate test string enforce Authorization', async () => {
    // @ts-ignore
    const ret = await new DefaultAdapter({
      enforcer: new DummyEnforcerAction(),
    }).validate("token", {});
    expect(ret).toEqual({
      token: {},
      tokenString: "token",
    });
  });

  test('validate test object enforce Authorization', async () => {
    // @ts-ignore
    const ret = await new DefaultAdapter({
      enforcer: new DummyEnforcerAction(),
    }).validate({
      token: {payload: {}, tokenString: 'token', header: {alg: 'rsa', kid: "1"}},
      tokenString: "token",
    }, {});
    expect(ret).toEqual({
      token: {
        header: {
          alg: "rsa",
          kid: "1",
        },
        payload: {},
        tokenString: "token",
      },
      tokenString: "token",
    });
  });


  test('validate test refreshToken with authorization', async () => {
    // @ts-ignore
    const ret = await new DefaultAdapter({
      enforcer: new DummyEnforcerAction(),
      clientAuthorization: new DummyClientAuthorization({}),
      // @ts-ignore
    }).refreshToken({}, {});
    expect(ret).toEqual({
    });
  });

  test('validate test refreshToken with authorization 2', async () => {
    // @ts-ignore
    const ret = await new DefaultAdapter({
      enforcer: new DummyEnforcerAction(),
      clientAuthorization: new DummyClientAuthorization({}),
      // @ts-ignore
      // eslint-disable-next-line babel/camelcase
    }).refreshToken({access_token: {}}, {});
    expect(ret).toEqual({
    });
  });

  test('validate test refreshToken without authorization', async () => {
    // @ts-ignore
    const ret = await new DefaultAdapter({
      enforcer: new DummyEnforcerAction(),
      clientAuthorization: new DummyClientAuthorization({}),
      // @ts-ignore
    }).refreshToken({});
    expect(ret).toEqual({
    });
  });
});
