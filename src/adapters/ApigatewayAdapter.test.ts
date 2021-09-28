/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */
import {decodeToken} from '../utils/TokenUtils';
import {DummySecurityAdapter} from "../utils/DummyImplementations.test";

import {DefaultApigatewayAdapter} from "./ApigatewayAdapter";

jest.mock('../utils/TokenUtils');


describe('ApigatewayAdapter tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    decodeToken.mockImplementation(() => { return {}; });
  });

  test('validate test', async () => {
    // @ts-ignore
    const ret = await new DefaultApigatewayAdapter({securityAdapter: new DummySecurityAdapter()}).validate({
      headers: {
        Authorization: "Bearer JWT",
      },
    });
    expect(ret).toEqual({
      token: {
        header: {
          alg: "alg",
          kid: "1",
        },
        payload: {},
        tokenString: "JWT",
      },
      tokenString: "JWT",
    });
  });

  test('validate authorizationToken test', async () => {
    // @ts-ignore
    const ret = await new DefaultApigatewayAdapter({securityAdapter: new DummySecurityAdapter()}).validate({
      authorizationToken: "Bearer JWT",
    });
    expect(ret).toEqual({
      token: {
        header: {
          alg: "alg",
          kid: "1",
        },
        payload: {},
        tokenString: "JWT",
      },
      tokenString: "JWT",
    });
  });

  test('validate test without Token', async () => {
    let error = false;
    try {
      // @ts-ignore

      await new DefaultApigatewayAdapter({securityAdapter: new DummySecurityAdapter()}).validate({
        // @ts-ignore
        authorizationToken: null,
      });
    } catch (e:any) {
      expect(e.message).toEqual('Expected \'event.authorizationToken\' parameter to be set');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('validate test without bearer Token', async () => {
    let error = false;
    try {
      // @ts-ignore

      await new DefaultApigatewayAdapter({securityAdapter: new DummySecurityAdapter()}).validate({
        authorizationToken: "JWT",
      });
    } catch (e:any) {
      expect(e.message).toEqual('Invalid Authorization token - \'JWT\' does not match \'Bearer .*\'');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('validate test without bearer Token empty', async () => {
    let error = false;
    try {
      // @ts-ignore

      await new DefaultApigatewayAdapter({securityAdapter: new DummySecurityAdapter()}).validate({
        authorizationToken: "Bearer",
      });
    } catch (e:any) {
      expect(e.message).toEqual('Invalid Authorization token - \'Bearer\' does not match \'Bearer .*\'');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

});
