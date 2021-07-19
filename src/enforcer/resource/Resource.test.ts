/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */

import {AdapterCache} from "../../cache/AdapterCache";
import {
  DummyCache,
  DummyClientAuthorization,
  DummyRestCalls, DummyServiceAccount,
  DummyUmaConfiguration,
} from "../../utils/DummyImplementations.test";
import {ClientAuthorization} from "../../clients/ClientAuthorization";

import {DefaultResourceChecker} from "./Resource";

let cache:AdapterCache;
let clientAuthorization:ClientAuthorization;
const keycloakJSON = () => ({
  realm: 'realm',
  resource: 'resource',
});
describe('Resource tests', () => {
  beforeEach(async () => {
    cache = new DummyCache('["resourceId"]');
    clientAuthorization = new DummyClientAuthorization({});
    // @ts-ignore
  });

  test('Resource test', async () => {
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    // @ts-ignore
    await dr.matchResource({token: {payload: {authorization: {
      permissions: [
        {
          rsid: 'resourceId',
        },
      ],
    }}}}, {
      resources: [],
      resource: {}});
  });

  test('Resource test RPT', async () => {
    clientAuthorization = new DummyClientAuthorization({
      decodedAccessToken: {
        authorization: {
          permissions: [
            {
              rsid: 'resourceId',
            },
          ],
        },
      },
    });
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    // @ts-ignore
    await dr.matchResource({token: {payload: {}}}, {
      resources: [],
      resource: {}});
  });

  test('Resource test scope', async () => {
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    // @ts-ignore
    await dr.matchResource({token: {payload: {authorization: {
      permissions: [
        {
          rsid: 'resourceId',
          scopes: ['READ'],
        },
      ],
    }}}}, {
      resources: [],
      resource: {scope: 'READ'}});
  });

  test('Resource test scope Fail', async () => {
    let error = false;
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    try {
      // @ts-ignore
      await dr.matchResource({token: {payload: {authorization: {
        permissions: [
          {
            rsid: 'resourceId',
            scopes: ['READ'],
          },
        ],
      }}}}, {
        resources: [],
        resource: {scope: 'WRITE'}});
    } catch (e) {
      expect(e.message).toEqual('Access is denied');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });


  test('Resource test does not exist', async () => {
    let error = false;
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    try {
      // @ts-ignore
      await dr.matchResource({token: {payload: {authorization: {
        permissions: [
          {
            rsid: 'someResource',
            scopes: ['READ'],
          },
        ],
      }}}}, {
        resources: [],
        resource: {scope: 'READ'}});
    } catch (e) {
      expect(e.message).toEqual('Access is denied');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });

  test('Resource test does not have permissions ', async () => {
    let error = false;
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    try {
      // @ts-ignore
      await dr.matchResource({token: {payload: {authorization: {
        permissions: null,
      }}}}, {
        resources: [],
        resource: {scope: 'READ'}});
    } catch (e) {
      expect(e.message).toEqual('Access is denied');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });


  test('Resource test empty', async () => {
    let error = false;
    clientAuthorization = new DummyClientAuthorization({
      decodedAccessToken: {
        authorization: {
          permissions: [
            {
              rsid: 'resourceId',
            },
          ],
        },
      },
    });
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    try {
    // @ts-ignore
      await dr.matchResource({token: {payload: {}}}, {
        resources: []});
    } catch (e) {
      expect(e.message).toEqual('Access is denied');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });


  test('Resource test empty resources', async () => {
    let error = false;
    clientAuthorization = new DummyClientAuthorization({
      decodedAccessToken: {
        authorization: {
          permissions: [
            {
              rsid: 'resourceId',
            },
          ],
        },
      },
    });
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    try {
    // @ts-ignore
      await dr.matchResource({token: {payload: {}}}, {});
    } catch (e) {
      expect(e.message).toEqual('Access is denied');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });
  test('Resource test without authorization', async () => {
    let error = false;
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache,
      clientAuthorization});
    try {
      // @ts-ignore
      await dr.matchResource({token: {payload: {}}}, null);
    } catch (e) {
      expect(e.message).toEqual('enforcer does not exists');
      error = true;
    }
    if (!error) {
      throw new Error('invalid test');
    }
  });


  test('Resource test', async () => {
    // @ts-ignore
    const dr = new DefaultResourceChecker({keycloakJson: keycloakJSON, cache: new DummyCache(),
      clientAuthorization,
      umaConfiguration: new DummyUmaConfiguration(),
      restClient: new DummyRestCalls('["test"]'),
      serviceAccount: new DummyServiceAccount("JWT"),
    });
    // @ts-ignore
    const value = await dr.getResource({token: {payload: {authorization: {
      permissions: [
        {
          rsid: 'resourceId',
        },
      ],
    }}}}, {});
    expect(value).toEqual(["test"]);
  });
});
