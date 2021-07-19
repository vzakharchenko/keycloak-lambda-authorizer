/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */

import {DummyCache, DummyRestCalls} from "../utils/DummyImplementations.test";
import {keycloakJsonFunction} from "../Options";
import {RestCalls} from "../utils/restCalls";
import {AdapterCache} from "../cache/AdapterCache";

import {DefaultUmaConfiguration} from "./UmaConfiguration";

let cache:AdapterCache;
// @ts-ignore
const keycloakJSON:keycloakJsonFunction = async () => { return {realm: 'realm', 'auth-server-url': 'http://url.com/'}; };
let restCall:RestCalls;
describe('UmaConfiguration tests', () => {
  beforeEach(async () => {
    cache = new DummyCache();
    restCall = new DummyRestCalls('{}');
        // @ts-ignore
  });

  test('test  getUma2Configuration', async () => {
    // @ts-ignore
    const umaResponse = await new DefaultUmaConfiguration({cache, keycloakJson: keycloakJSON, restClient: restCall}).getUma2Configuration({});
    expect(umaResponse).toEqual({});
  });

  test('test  getUma2Configuration cache', async () => {
    cache = new DummyCache('{}');
    // @ts-ignore
    const umaResponse = await new DefaultUmaConfiguration({cache, keycloakJson: keycloakJSON}).getUma2Configuration({});
    expect(umaResponse).toEqual({});
  });

});
