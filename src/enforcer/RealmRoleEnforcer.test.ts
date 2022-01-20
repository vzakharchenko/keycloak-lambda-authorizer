/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */

import {RequestContent} from "../Options";

import {RealmRoleEnforcer} from "./RealmRoleEnforcer";

let requestContent: RequestContent;

describe('RealmRoleEnforcer tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    requestContent = {
      // @ts-ignore
      token: {
        payload: {
          realm_access: {
            roles: ['realmRole'],
          },
        },
      },
    };
  });

  test('RealmRoleEnforcer test', async () => {
    // @ts-ignore
    await new RealmRoleEnforcer({}).enforce(requestContent, () => { return {realmRole: 'realmRole'}; });
  });

  test('RealmRoleEnforcer Error 1', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new RealmRoleEnforcer({}).enforce(requestContent, () => {
        return null;
      });
    } catch (e) {
      error = true;
      // @ts-ignore
      expect(e.message).toEqual('enforcer does not provided');
    }
    if (!error) {
      throw new Error('invalid test ');
    }
  });

  test('RealmRoleEnforcer Error 2', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new RealmRoleEnforcer({}).enforce(requestContent, () => {
        return {realmRole: null};
      });
    } catch (e) {
      error = true;
      // @ts-ignore
      expect(e.message).toEqual('Realm Role is Empty');
    }
    if (!error) {
      throw new Error('invalid test ');
    }
  });

  test('RealmRoleEnforcer Error 3', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new RealmRoleEnforcer({}).enforce(requestContent, () => {
        return {realmRole: 'testRole'};
      });
    } catch (e) {
      error = true;
      // @ts-ignore
      expect(e.message).toEqual('Access Denied');
    }
    if (!error) {
      throw new Error('invalid test ');
    }
  });
  test('RealmRoleEnforcer Error 4', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new RealmRoleEnforcer({}).enforce({
        // @ts-ignore
        token: {
          payload: {
          },
        },
      }, () => {
        return {realmRole: 'realmRole'};
      });
    } catch (e) {
      error = true;
      // @ts-ignore
      expect(e.message).toEqual('Access Denied');
    }
    if (!error) {
      throw new Error('invalid test ');
    }
  });

});
