/* eslint-disable @typescript-eslint/ban-ts-comment
 */

import {DummyResourceChecker} from "../utils/DummyImplementations.test";

import {ResourceEnforcer} from "./ResourceEnforcer";

describe('ResourceEnforcer tests', () => {
  beforeEach(async () => {
    // @ts-ignore
  });

  test('ResourceEnforcer test', async () => {
 // @ts-ignore
    await new ResourceEnforcer({resourceChecker: new DummyResourceChecker()}).enforce({}, () => { return {}; });
  });

  test('ResourceEnforcer Error', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new ResourceEnforcer({resourceChecker: new DummyResourceChecker()}).enforce({}, () => {
        return null;
      });
    } catch (e) {
      error = true;
      expect(e.message).toEqual('enforcer does not provided');
    }
    if (!error) {
      throw new Error('invalid test ');
    }
  });

});
