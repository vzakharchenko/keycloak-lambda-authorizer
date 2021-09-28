/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */

import {AdapterCache} from "./AdapterCache";
import {DefaultCache} from "./DefaultCache";

describe('KeycloakUtils tests', () => {
  beforeEach(async () => {
    // @ts-ignore
  });

  test('getKeycloakUrl publicKey test', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    cache.put('publicKey', 'key', 100);
    expect(cache.get('publicKey', 'key')).toEqual(100);

  });

  test('getKeycloakUrl uma2-configuration test', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    cache.put('uma2-configuration', 'key', 100);
    expect(cache.get('uma2-configuration', 'key')).toEqual(100);

  });
  test('getKeycloakUrl client_credentials test', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    cache.put('client_credentials', 'key', 100);
    expect(cache.get('client_credentials', 'key')).toEqual(100);

  });
  test('getKeycloakUrl resource test', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    cache.put('resource', 'key', 100);
    expect(cache.get('resource', 'key')).toEqual(100);

  });
  test('getKeycloakUrl rpt test', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    cache.put('rpt', 'key', 100);
    expect(cache.get('rpt', 'key')).toEqual(100);

  });

  test('getKeycloakUrl put test error', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    let error = false;
    try {
      cache.put('error', 'key', 100);
    } catch (e:any) {
      error = true;
      expect(e.message).toEqual('Unsupported Region');
    }
    if (!error) {
      throw new Error('wrong test');
    }


  });
  test('getKeycloakUrl get test error', async () => {
    // @ts-ignore
    const cache:AdapterCache = new DefaultCache();
    let error = false;
    try {
      cache.get('error', 'key');
    } catch (e) {
      error = true;
      // @ts-ignore
      expect(e.message).toEqual('Unsupported Region');
    }
    if (!error) {
      throw new Error('wrong test');
    }


  });

  test('getKeycloakUrl publicKey test 2', async () => {
    // @ts-ignore
    let cache:AdapterCache = new DefaultCache();
    cache.put('publicKey', 'key', 100);
    expect(cache.get('publicKey', 'key')).toEqual(100);
    cache = new DefaultCache();
    expect(cache.get('publicKey', 'key')).toEqual(100);

  });

});
