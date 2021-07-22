/* eslint-disable require-await, babel/camelcase, @typescript-eslint/ban-ts-comment
 */


import {RefreshContext, RequestContent, TokenJson} from "../Options";
import {
  DummyCache,
  DummyEnforcerAction,
  DummyRestCalls,
  DummyUmaConfiguration,
} from "../utils/DummyImplementations.test";
import {AdapterCache} from "../cache/AdapterCache";
import {decodeToken, isExpired, transformRequestToRefresh, transformResfreshToRequest} from "../utils/TokenUtils";
import {UmaConfiguration} from "../uma/UmaConfiguration";
import {RestCalls} from "../utils/restCalls";

import {DefaultClientAuthorization} from "./ClientAuthorization";

jest.mock("../utils/TokenUtils");

const keycloakJsonSecret = () => {
  return {
    realm: 'relam',
    "auth-server-url": 'http://url.com',
    "ssl-required": true,
    resource: 'client',
    credentials: {
      secret: 'secret',
    },
  };
};

const keycloakJsonKeys = () => {
  return {
    realm: 'relam',
    "auth-server-url": 'http://url.com',
    "ssl-required": true,
    resource: 'client',
  };
};


// @ts-ignore
transformResfreshToRequest.mockImplementation((refreshContext:RefreshContext):RequestContent => {
  return {
    tokenString: refreshContext.token.access_token,
    token: decodeToken(refreshContext.token.access_token),
    request: refreshContext.request,
    realm: refreshContext.realm,
  };
});
// @ts-ignore
transformRequestToRefresh.mockImplementation((token:TokenJson, requestContext:RequestContent):RefreshContext => {
  return {
    token,
    request: requestContext.request,
    realm: requestContext.realm,
  };
});

let requestContent: RequestContent;
let cache: AdapterCache;
let umaConfiguration: UmaConfiguration;
let restClient: RestCalls;

describe('ClientAuthorization tests', () => {
  beforeEach(async () => {
    umaConfiguration = new DummyUmaConfiguration();
    restClient = new DummyRestCalls("{}");
        // @ts-ignore
    requestContent = {
      token: {
        payload: {},
        header: {
          alg: 'rsa',
          kid: '1',
        },
        tokenString: 'token',
      },
    };
        // @ts-ignore
    isExpired.mockImplementation(() => false);
    cache = new DummyCache((region: string, key: string) => {
      if (region === 'client_credentials' || region === 'rpt') {
        return JSON.stringify({
          decodedAccessToken: {},
        });
      } else {
        return undefined;
      }
    });
  });

  test('ClientAuthorization secret test', async () => {
        // @ts-ignore

    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
    }).clientIdAuthorization(
            requestContent,
        )).toEqual('client_id=client&client_secret=secret');
  });

  test('ClientAuthorization keys test', async () => {
        // @ts-ignore

    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonKeys,
      keys: {
        privateKey: {
          key: '-----BEGIN PRIVATE KEY-----\n' +
                        'MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCqtsnmVbhKd9X1\n' +
                        'rkNalJO27OmMgF9jT8olOHuyqft1xKak9B04huWWGbCj6Q03Ugp3z9ZPvcowITEu\n' +
                        'aQPCRrkLCndTO8K6wSOJ1ygW8tWPkkN0okyiMVb35+0mdqHV/f1F+9PBIUgFh5F9\n' +
                        'L3HXtP42pk3NbNfP//o7BAjyN2NBiN+scz2dE/wORJE1sgLi3ICXTp6KXvzNlXwp\n' +
                        'WfGv4bRuTxJZ8XAjJfElihtQ6pUKDjRyYMFnx2OltFjSfTl5BiA02slFTDrf7UjG\n' +
                        'c3srihCnwCl377MqhCTYK9/NZEkBkAH1yasoWjv1NSXDNAyLGLjlE1w2SHQ/MwFD\n' +
                        'AZkig25HAgMBAAECggEAdU/fNrW5SxNGqOnzxw9K4u2zIKYm5qwyEZnbB0/gSXG1\n' +
                        'wq0uV2X750YIKNtCBb4PC357m5iklKZ6kZYAy0SmbHvou/3ZN1T6AwMjvYFqWJr+\n' +
                        'V+wgFWUqinmKcmAbnl5H6gu/3Hvubj5XMFumM8Fg4FUwKfad54XUgzGmpCyDvMge\n' +
                        '+jJYTQDmZaDGFKyc+LXeT/W1r53Xzq4IesZsv91CA4P7sxuSH3+2SIIeKTLBhhxd\n' +
                        'wzjdZ7jZhOWnxsGcJaQWS0T9mbeRnIPT153bNBYPIaP4p5yPgUdzad/UyGiY6nO1\n' +
                        'xJ48Pf6/WspK7t54zRTEJkb9gZvu8w2pMyupAMBW4QKBgQDSMOeKx1cStL9K4APV\n' +
                        '8j7PH//sbKBQea3pV1aC9EiYhj9kmeaIEGHKZBc6nTaJ8tCvET67jymPqJLBqyPU\n' +
                        'ef87YelAgD3XV42vorTHXJX+9DU58YKpblirdjVYpcoPNlke3cRde01NGw5S6JSh\n' +
                        'e9nNIjTccVqZTjLNdSrrgmKWuwKBgQDP61xMuaCypuaL/mYoLiZfgpuVjO7nAooy\n' +
                        'KMM/Z0D34tfRRWbCLOdchz0iWT+0F7rTzY1uOuW3cYdKdU7IS2aBPO0p6rPgCsOY\n' +
                        'WNO36a9zxPEghshm21lDZYl8t4Wp5PjnXdjepequ0KNYrfVj2rar8V83cDOWarAN\n' +
                        'PJwyXSi75QKBgGP0uce3cGMG7Ylv6qMNpmzdbNlD9yEOHHRBAnUYMoXGIdN3lLfU\n' +
                        'Ao06+Aj5xnvnqvH2I30SYdNdeRz8g/eBZK0arM/trHsBufFyUMIV94bdH4rEnTxx\n' +
                        'q10uw8O6Y9LEJ7GUCNPj1Sj72t32mOgKe9Mflz/V8B3DoEkwlQ6WXMgNAoGAGflB\n' +
                        '94e87nRxGo32PxC81HOhcgZAFfW4Q9nZwkLo186rvUXZN2qaoHF4jqDtl1bbjPgB\n' +
                        'sgKDje4Nw5xx8g2RSZXN3s2mGNffZVm7YR89Ps4cfT65LDg8p3G4wi6+8OFcwrJz\n' +
                        'lCTP83S24y4gGJBK/6HQjkFjAGhlg9HNhXEj1I0CgYBm2UOnqZ+c6Eg4m0kNlcbW\n' +
                        'PLJjiOd1ahc7lSMkep6kXG9MKqiyvfvbbIkRLIxU7s8W+TG0vNJxUrXzWg9FM3Sp\n' +
                        'JEr8I4E1mzB26LwvEame9bGtV9rJJEKH1JgcL5L4Yny52vAGUoC8n4bN6vRb51M2\n' +
                        'aSV+AcDJyQBwjvRjN8kfdQ==\n' +
                        '-----END PRIVATE KEY-----\n',
        },
        publicKey: {
          key: '',
        },
      },
    }).clientIdAuthorization(
            requestContent,
        )).toContain('client_id=client&client_assertion=');
  });

  test('ClientAuthorization  test Errors', async () => {
    let error = false;
    try {
      await new DefaultClientAuthorization({
                // @ts-ignore
        keycloakJson: keycloakJsonKeys,
      }).clientIdAuthorization(
                requestContent,
            );
    } catch (e) {
      error = true;
      expect(e.message).toEqual('Unsupported Credential Type');
    }
    if (!error) {
      throw new Error('wrong test');
    }

  });

  test('ClientAuthorization test', async () => {
        // @ts-ignore

    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
    }).clientAuthentication(
            requestContent,
        )).toEqual({
          decodedAccessToken: {},
        });
  });


  test('ClientAuthorization test token expired', async () => {
        // @ts-ignore
        // @ts-ignore
    isExpired.mockImplementation(() => true);
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).clientAuthentication(
            requestContent,
        )).toEqual({
          decodedAccessToken: null,
          decodedRefreshToken: null,
        });
  });

  test('ClientAuthorization test RefreshToken expired', async () => {
        // @ts-ignore
        // @ts-ignore
    isExpired.mockImplementation(() => false);
    cache = new DummyCache();
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).clientAuthentication0(
      {
        ...requestContent, ...{
          decodedRefreshToken: {},
        },
      }, JSON.stringify({
        decodedRefreshToken: {},
        refreshToken: 'refreshToken',
      }),
        )).toEqual({
          decodedAccessToken: null,
          decodedRefreshToken: null,
        });
  });
  test('ClientAuthorization test clientJWT error', async () => {
    let error = false;
    try {
      await new DefaultClientAuthorization({
                // @ts-ignore
        keycloakJson: keycloakJsonSecret,
        cache,
        umaConfiguration,
        restClient,
        logger: console,
      }).clientJWT(
                {id: 'test'}, {key: 'test'},
            );
    } catch (e) {
      error = true;
      expect(e.message).toEqual('error:0909006C:PEM routines:get_name:no start line');
    }
    expect(error).toEqual(true);

  });


  test('ClientAuthorization test exchangeRPT', async () => {
        // @ts-ignore
    cache = new DummyCache();
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).exchangeRPT(
            requestContent, "token", 'clientId',
        )).toEqual({});
  });

  test('ClientAuthorization test exchangeRPT error', async () => {
    let error = false;
    try {
            // @ts-ignore
      cache = new DummyCache();
      await new DefaultClientAuthorization({
                // @ts-ignore
        keycloakJson: keycloakJsonSecret,
        cache,
        umaConfiguration,
        restClient: new DummyRestCalls("d"),
      }).exchangeRPT(
                requestContent, "token", 'clientId',
            );
    } catch (e) {
      error = true;
      expect(e.message).toEqual('SyntaxError: Unexpected token d in JSON at position 0');
    }
    expect(error).toEqual(true);
  });

  test('ClientAuthorization test getRPT', async () => {
        // @ts-ignore
    cache = new DummyCache();
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).getRPT(
            requestContent,
            {},
        )).toEqual({
          decodedAccessToken: null,
          decodedRefreshToken: null,
        });
  });

  test('ClientAuthorization test getRPT enforce', async () => {
        // @ts-ignore
    cache = new DummyCache();
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).getRPT(
            requestContent,
            {clientId: 'clientId'},
        )).toEqual({
          decodedAccessToken: null,
          decodedRefreshToken: null,
        });
  });

  test('ClientAuthorization test getRPT with cache', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).getRPT(
            requestContent,
            {},
        )).toEqual({
          decodedAccessToken: {},
        });
  });

  test('ClientAuthorization test getRPT with cache and expired', async () => {
        // @ts-ignore
    isExpired.mockImplementation(() => true);
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).getRPT(
            requestContent,
            {},
        )).toEqual({
          decodedAccessToken: null,
          decodedRefreshToken: null,
        });
  });

  test('ClientAuthorization test getRPT Not able to refresh token', async () => {
        // @ts-ignore
    isExpired.mockImplementation(() => true);
    cache = new DummyCache((region: string, key: string) => {
      if (region === 'rpt') {
        return JSON.stringify({
          decodedAccessToken: {},
          refresh_token: 'token',
        });
      } else {
        return undefined;
      }
    });
    let error = false;
    try {
      await new DefaultClientAuthorization({
                // @ts-ignore
        keycloakJson: keycloakJsonSecret,
        cache,
        umaConfiguration,
        restClient,
      }).getRPT(
                requestContent,
                {},
            );
    } catch (e) {
      error = true;
      expect(e.message).toEqual('Not able to refresh token');
    }
    expect(error).toEqual(true);
  });

  test('ClientAuthorization test getRPT Not able to refresh token 2', async () => {
    // @ts-ignore
    transformRequestToRefresh.mockImplementation((token:TokenJson, requestContext:RequestContent):RefreshContext => {
      return {
        // @ts-ignore
        token: null,
        request: requestContext.request,
        realm: requestContext.realm,
      };
    });
        // @ts-ignore
    isExpired.mockImplementation(() => true);
    cache = new DummyCache((region: string, key: string) => {
      if (region === 'rpt') {
        return JSON.stringify({
          decodedAccessToken: {},
          refresh_token: 'token',
        });
      } else {
        return undefined;
      }
    });
    let error = false;
    try {
      await new DefaultClientAuthorization({
                // @ts-ignore
        keycloakJson: keycloakJsonSecret,
        cache,
        umaConfiguration,
        restClient,
      }).getRPT(
                requestContent,
                {},
            );
    } catch (e) {
      error = true;
      expect(e.message).toEqual('Not able to refresh token');
    }
    expect(error).toEqual(true);
  });
  test('ClientAuthorization test getRPT Not able to refresh token 3', async () => {
    // @ts-ignore
    transformRequestToRefresh.mockImplementation((token:TokenJson, requestContext:RequestContent):RefreshContext => {
      return {

        token: {...token, ...{refresh_token: undefined}},
        request: requestContext.request,
        realm: requestContext.realm,
      };
    });
        // @ts-ignore
    isExpired.mockImplementation(() => true);
    cache = new DummyCache((region: string, key: string) => {
      if (region === 'rpt') {
        return JSON.stringify({
          decodedAccessToken: {},
          refresh_token: 'token',
        });
      } else {
        return undefined;
      }
    });
    let error = false;
    try {
      await new DefaultClientAuthorization({
                // @ts-ignore
        keycloakJson: keycloakJsonSecret,
        cache,
        umaConfiguration,
        restClient,
      }).getRPT(
                requestContent,
                {},
            );
    } catch (e) {
      error = true;
      expect(e.message).toEqual('Not able to refresh token');
    }
    expect(error).toEqual(true);
  });

  test('ClientAuthorization test getTokenByCode', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).getTokenByCode(
            requestContent,
            'code', 'http://localhost:8080',
        )).toEqual({
          decodedAccessToken: null,
          decodedRefreshToken: null,
        });
  });
  test('ClientAuthorization test keycloakRefreshToken', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
      enforcer: new DummyEnforcerAction(),
      logger: console,
    }).keycloakRefreshToken({
      token: {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        decodedAccessToken: {},
        decodedRefreshToken: {},
        refresh_expires_in: 10,
      }})).toEqual({
        token: {},
      });
  });

  test('ClientAuthorization test keycloakRefreshToken enforce', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      enforcer: new DummyEnforcerAction(),
      restClient,
      logger: console,
    }).keycloakRefreshToken(
      {
        token: {
          access_token: 'access_token',
          refresh_token: 'refresh_token',
          decodedAccessToken: {},
          decodedRefreshToken: {},
          refresh_expires_in: 10,
        }}, () => ({resource: {}}),
        )).toEqual({
          token: {},
        });
  });


  test('ClientAuthorization test keycloakRefreshToken enforce skip 1', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      enforcer: new DummyEnforcerAction(),
      restClient,
      logger: console,
    }).keycloakRefreshToken(
      {
        token: {
          access_token: 'access_token',
          refresh_token: 'refresh_token',
          decodedAccessToken: {},
          decodedRefreshToken: {},
          refresh_expires_in: 10,
        }}, () => ({realmRole: 'realmRole'}),
        )).toEqual({
          token: {},
        });
  });
  test('ClientAuthorization test keycloakRefreshToken enforce skip 2', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      enforcer: new DummyEnforcerAction(),
      restClient,
      logger: console,
    }).keycloakRefreshToken(
      {
        token: {
          access_token: 'access_token',
          refresh_token: 'refresh_token',
          decodedAccessToken: {},
          decodedRefreshToken: {},
          refresh_expires_in: 10,
          // @ts-ignore
        }}, () => ({clientRole: {clientRole: 'clientRole', clientId: 'clientId'}}),
        )).toEqual({
          token: {},
        });
  });

  test('ClientAuthorization test keycloakRefreshToken null', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
      logger: console,
    }).keycloakRefreshToken(
      {
        // @ts-ignore
        token: undefined}, {clientRole: {clientRole: 'clientRole', clientId: 'clientId'}},
        )).toEqual(null);
  });

  test('ClientAuthorization test keycloakRefreshToken error null', async () => {
     // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient: new DummyRestCalls("f"),
      logger: console,
    }).keycloakRefreshToken(
      {
        token: {
          access_token: 'access_token',
          refresh_token: 'refresh_token',
          decodedAccessToken: {},
          decodedRefreshToken: {},
          refresh_expires_in: 10,
        }},
        )).toEqual(null);
  });

  test('ClientAuthorization test logout', async () => {
        // @ts-ignore
    expect(await new DefaultClientAuthorization({
            // @ts-ignore
      keycloakJson: keycloakJsonSecret,
      cache,
      umaConfiguration,
      restClient,
    }).logout(
            requestContent,
            {},
        )).toEqual(undefined);
  });

});


