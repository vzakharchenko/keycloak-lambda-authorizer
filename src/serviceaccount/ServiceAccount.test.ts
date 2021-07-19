/* eslint-disable @typescript-eslint/ban-ts-comment
 */

import {DummyClientAuthorization} from "../utils/DummyImplementations.test";

import {DefaultServiceAccount} from "./ServiceAccount";

describe('ServiceAccount tests', () => {
  beforeEach(async () => {
    // @ts-ignore
  });


  test('ServiceAccount test', async () => {
   // @ts-ignore
    const defaultServiceAccount = new DefaultServiceAccount({
      // eslint-disable-next-line babel/camelcase
      clientAuthorization: new DummyClientAuthorization({access_token: {test: 'test'}}),
    });
    // @ts-ignore
    const token = await defaultServiceAccount.getServiceAccountToken({});
    expect(token).toEqual({
      test: "test",
    });
  });

});
