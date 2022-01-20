/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */

import {RequestContent} from "../Options";

import {ClientRoleEnforcer} from "./ClientRoleEnforcer";

let requestContent: RequestContent;

describe('ClientRoleEnforcer tests', () => {
  beforeEach(async () => {
    // @ts-ignore
    requestContent = {
      // @ts-ignore
      token: {
        payload: {
          resource_access: {
            clientId: {roles: ['clientRole']},
          },
        },
      },
    };
  });

  test('ClientRoleEnforcer test', async () => {
    // @ts-ignore
    await new ClientRoleEnforcer({}).enforce(requestContent,
        () => {
          return {
            clientRole: {clientRole: 'clientRole', clientId: 'clientId'}};
        });
  });

  test('ClientRoleEnforcer Error 1', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new ClientRoleEnforcer({}).enforce(requestContent, () => {
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

  test('ClientRoleEnforcer Error 2', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new ClientRoleEnforcer({}).enforce(requestContent, () => {
        return {clientRole: null};
      });
    } catch (e) {
      error = true;
      // @ts-ignore
      expect(e.message).toEqual('Client Role is Empty');
    }
    if (!error) {
      throw new Error('invalid test ');
    }
  });

  test('ClientRoleEnforcer Error 3', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new ClientRoleEnforcer({}).enforce(requestContent, () => {
        return {
          clientRole: {clientRole: 'wrongRole', clientId: 'clientId'}};
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

  test('ClientRoleEnforcer Error 4', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new ClientRoleEnforcer({}).enforce(requestContent, () => {
        return {
          clientRole: {clientRole: 'clientRole', clientId: 'wrongClient'}};
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
  test('ClientRoleEnforcer Error 5', async () => {
    let error = false;
    try {


      // @ts-ignore
      await new ClientRoleEnforcer({}).enforce({
        // @ts-ignore
        token: {
          payload: {
          },
        },
      }, () => {
        return {
          clientRole: {clientRole: 'clientRole', clientId: 'clientId'}};
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
