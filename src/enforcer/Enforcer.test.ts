/* eslint-disable require-await, @typescript-eslint/ban-ts-comment, babel/camelcase
 */

import {RequestContent} from "../Options";
import {DummyResourceChecker} from "../utils/DummyImplementations.test";

import {DefaultEnforcer} from "./Enforcer";
import {ResourceEnforcer} from "./ResourceEnforcer";
import {RealmRoleEnforcer} from "./RealmRoleEnforcer";

let requestContent: RequestContent;

describe('Enforcer tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    requestContent = {
      // @ts-ignore
      token: {
        payload: {
          realm_access: {
            roles: ['realmRole'],
          },
          resource_access: {
            clientId: {roles: ['clientRole']},
          },
        },
      },
    };
  });

  test('Enforcer clientRole test', async () => {
    // @ts-ignore
    await new DefaultEnforcer({}).enforce(requestContent,
        () => {
          return {
            clientRole: {clientRole: 'clientRole', clientId: 'clientId'}};
        });
  });

  test('Enforcer realmRole test', async () => {
    // @ts-ignore
    await new DefaultEnforcer({}).enforce(requestContent,
        () => {
          return {
            realmRole: 'realmRole'};
        });
  });

  test('Enforcer resource test', async () => {
    // @ts-ignore
    await new DefaultEnforcer({resourceChecker: new DummyResourceChecker()}).enforce({}, () => { return {}; });
  });

  test('Enforcer Error', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new DefaultEnforcer({}).enforce(requestContent, () => {
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


});
