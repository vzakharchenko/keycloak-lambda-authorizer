/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
*/

import {
  AdapterContent,
  RequestContent,
  updateEnforce,
  updateOptions,
} from "./Options";

describe('Options tests', () => {
  beforeEach(async () => {
        // @ts-ignore
  });

  test('test updateEnforce', async () => {
    expect(typeof updateEnforce({})).toEqual('function');
  });

  test('test updateEnforce func', async () => {
    expect(typeof updateEnforce((options: AdapterContent, requestContent: RequestContent) => {
      return {};
    })).toEqual('function');
  });

  test('test updateOptions keycloakJson', async () => {
    // @ts-ignore
    expect(typeof updateOptions({keycloakJson: {}}).keycloakJson).toEqual('function');
  });
  test('test updateOptions keycloakJson func', async () => {
    // @ts-ignore
    // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
    expect(typeof updateOptions({keycloakJson: () => {}}).keycloakJson).toEqual('function');
  });

  test('test structures', async () => {
    // @ts-ignore
    expect(typeof updateOptions({keycloakJson: {},
      // @ts-ignore
      keys: {},
      // @ts-ignore
      cache: {},
      // @ts-ignore
      logger: {},
      // @ts-ignore
      restClient: {},
      // @ts-ignore
      enforcer: {},
      // @ts-ignore
      umaConfiguration: {},
      // @ts-ignore
      clientAuthorization: {},
      // @ts-ignore
      serviceAccount: {},
      // @ts-ignore
      securityAdapter: {},
      // @ts-ignore
      resourceChecker: {},
      // @ts-ignore
      jwks: {},
    }).keycloakJson).toEqual('function');
  });
});
