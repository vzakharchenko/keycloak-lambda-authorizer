/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */
import {decodeToken, verifyToken} from '../utils/TokenUtils';
import {RequestContent} from "../Options";
import {DummyEnforcerAction} from "../utils/DummyImplementations.test";

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

});
