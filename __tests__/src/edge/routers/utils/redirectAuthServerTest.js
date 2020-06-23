jest.mock('../../../../../src/utils/TokenUtils');
jest.mock('../../../../../src/edge/lambdaEdgeUtils');
jest.mock('../../../../../src/utils/cookiesUtils');
jest.mock('../../../../../src/utils/restCalls');
const { decodeAccessToken, getActiveToken } = require('../../../../../src/utils/TokenUtils');
const redirectAuthServer = require('../../../../../src/edge/routes/utils/redirectAuthServer');
const cookiesUtils = require('../../../../../src/utils/cookiesUtils');
const { unauthorized } = require('../../../../../src/utils/CustomPageUtils');

const sessionManager = {
  checkSession: async () => true,
  updateSessionToken: async () => 'SESSION_JWT',
};

describe('testing redirectAuthServer', () => {
  beforeEach(() => {
    decodeAccessToken.mockImplementation(() => ({ accessToken: 'TOKEN', accessTokenDecode: { email: 'test@test', tenants: { testRealm: { resource: {} } } } }));
    getActiveToken.mockImplementation(async () => ({ accessToken: 'TOKEN', accessTokenDecode: { email: 'test@test' } }));
    cookiesUtils.getCookie.mockImplementation(() => ({
      session: 's',
      sessionToken: 'Session_TOKEN',
    }));
  });

  afterEach(() => {
  });

  test('test refreshResponse', async () => {
    const refreshResponse = redirectAuthServer.refreshResponse({
      acess_token: 'token',
      isChanged: true,
    }, 'refreshToken', {
      keycloakJson: () => ({
        realm: 'testRealm',
        resource: 'resource',
      }),
    });
    expect(refreshResponse)
      .toEqual({
        headers: {
          'set-cookie': [
            {
              key: 'Set-Cookie',
              value: 'KEYCLOAK_AWS_undefined_EXPIRE=undefined; Path=/; Expires=Invalid Date',
            },
            {
              key: 'Set-Cookie',
              value: 'KEYCLOAK_AWS_undefined=undefined; Path=/; Expires=Invalid Date',
            },
          ],
        },
        status: '200',
        statusDescription: 'OK',
      });
  });

  test('test refreshResponse false', async () => {
    const refreshResponse = redirectAuthServer.refreshResponse({
      acess_token: 'token',
      isChanged: false,
    }, 'refreshToken', {
      keycloakJson: () => ({
        realm: 'testRealm',
        resource: 'resource',
      }),
    });
    expect(refreshResponse)
      .toEqual({
        headers: {
          'set-cookie': [
            {
              key: 'Set-Cookie',
              value: 'KEYCLOAK_AWS_undefined_EXPIRE=undefined; Path=/; Expires=Invalid Date',
            },
          ],
        },
        status: '200',
        statusDescription: 'OK',
      });
  });
  test('test refreshResponse without refreshToken', async () => {
    const refreshResponse = redirectAuthServer.refreshResponse('token', null, { keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }) });
    expect(refreshResponse).toEqual({
      status: '200',
      statusDescription: 'OK',
    });
  });


  test('test checkToken without cookie', async () => {
    cookiesUtils.getCookie.mockImplementation(() => null);
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
        body: 'Redirecting to OIDC provider',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      logger: console,
    });
    expect(resp).toEqual(null);
  });

  test('test checkToken Invalid Session', async () => {
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
        body: 'Redirecting to OIDC provider',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      sessionManager: {
        checkSession: async () => false,
      },
      logger: console,
    });
    expect(resp).toEqual(null);
  });

  test('test checkToken expired token', async () => {
    getActiveToken.mockImplementation(async () => null);
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        status: '302',
        statusDescription: 'Found',
        body: 'Redirecting to OIDC provider',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      sessionManager,
      logger: console,
    });
    expect(resp).toEqual(null);
  });
  test('test checkToken error', async () => {
    getActiveToken.mockImplementation(async () => {
      throw new Error('test');
    });
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        body: "\n  <!DOCTYPE html>\n  <html lang=\"en\">\n  <head>\n      <!-- Simple HttpErrorPages | MIT License | https://github.com/AndiDittrich/HttpErrorPages -->\n      <meta charset=\"utf-8\" /><meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n      <title>We've got some trouble | 401 - Unauthorized</title>\n      <style type=\"text/css\">/*! normalize.css v5.0.0 | MIT License | github.com/necolas/normalize.css */html{font-family:sans-serif;line-height:1.15;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0}article,aside,footer,header,nav,section{display:block}h1{font-size:2em;margin:.67em 0}figcaption,figure,main{display:block}figure{margin:1em 40px}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace,monospace;font-size:1em}a{background-color:transparent;-webkit-text-decoration-skip:objects}a:active,a:hover{outline-width:0}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:inherit}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace,monospace;font-size:1em}dfn{font-style:italic}mark{background-color:#ff0;color:#000}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}audio,video{display:inline-block}audio:not([controls]){display:none;height:0}img{border-style:none}svg:not(:root){overflow:hidden}button,input,optgroup,select,textarea{font-family:sans-serif;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type=reset],[type=submit],button,html [type=button]{-webkit-appearance:button}[type=button]::-moz-focus-inner,[type=reset]::-moz-focus-inner,[type=submit]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type=button]:-moz-focusring,[type=reset]:-moz-focusring,[type=submit]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{border:1px solid silver;margin:0 2px;padding:.35em .625em .75em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{display:inline-block;vertical-align:baseline}textarea{overflow:auto}[type=checkbox],[type=radio]{box-sizing:border-box;padding:0}[type=number]::-webkit-inner-spin-button,[type=number]::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}[type=search]::-webkit-search-cancel-button,[type=search]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details,menu{display:block}summary{display:list-item}canvas{display:inline-block}template{display:none}[hidden]{display:none}/*! Simple HttpErrorPages | MIT X11 License | https://github.com/AndiDittrich/HttpErrorPages */body,html{width:100%;height:100%;background-color:#21232a}body{color:#fff;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,.5);padding:0;min-height:100%;-webkit-box-shadow:inset 0 0 100px rgba(0,0,0,.8);box-shadow:inset 0 0 100px rgba(0,0,0,.8);display:table;font-family:\"Open Sans\",Arial,sans-serif}h1{font-family:inherit;font-weight:500;line-height:1.1;color:inherit;font-size:36px}h1 small{font-size:68%;font-weight:400;line-height:1;color:#777}a{text-decoration:none;color:#fff;font-size:inherit;border-bottom:dotted 1px #707070}.lead{color:silver;font-size:21px;line-height:1.4}.cover{display:table-cell;vertical-align:middle;padding:0 20px}footer{position:fixed;width:100%;height:40px;left:0;bottom:0;color:#a0a0a0;font-size:14px}</style>\n  </head>\n  <body>\n      <div class=\"cover\"><h1>test <small>Error 401</small></h1><p class=\"lead\">Error: test</p><p>/</p></div>\n      <footer><p><a href=\"undefined\">keycloak-lambda-authorizer</a></p></footer>\n  </body>\n  </html>\n  ",
        status: '401',
        statusDescription: 'Unauthorized',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      sessionManager,
      route: { unauthorized },
      logger: console,
    });
    expect(resp).toEqual(null);
  });


  test('test checkToken redirect error', async () => {
    decodeAccessToken.mockImplementation(() => ({ accessToken: 'TOKEN', accessTokenDecode: { email: 'test@test', tenants: { testRealm: { } } } }));
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        body: 'Redirecting to OIDC provider',
        status: '302',
        statusDescription: 'Found',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      sessionManager,
      route: { unauthorized },
      logger: console,
    });
    expect(resp).toEqual(null);
  });

  test('test checkToken redirect error Realm', async () => {
    decodeAccessToken.mockImplementation(() => ({ accessToken: 'TOKEN', accessTokenDecode: { email: 'test@test', tenants: { } } }));
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        body: 'Redirecting to OIDC provider',
        status: '302',
        statusDescription: 'Found',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      sessionManager,
      route: { unauthorized },
      logger: console,
    });
    expect(resp).toEqual(null);
  });

  test('test checkToken redirect error Tenants', async () => {
    decodeAccessToken.mockImplementation(() => ({ accessToken: 'TOKEN', accessTokenDecode: { email: 'test@test' } }));
    const resp = await redirectAuthServer.checkToken((error, response) => {
      expect(response).toEqual({
        body: 'Redirecting to OIDC provider',
        status: '302',
        statusDescription: 'Found',
      });
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      request: {},
      sessionManager,
      route: { unauthorized },
      logger: console,
    });
    expect(resp).toEqual(null);
  });

  test('test checkToken', async () => {
    await redirectAuthServer.checkToken(() => {
      throw new Error('unexpected state');
    }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      sessionManager,
      logger: console,
    });
  });

  test('test redirectToKeycloak', async () => {
    await redirectAuthServer.redirectToKeycloak({}, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      sessionManager,
      logger: console,
    }, 'ttt', (error, resp) => {
      expect(resp).toEqual({
        body: 'Redirecting to OIDC provider',
        status: '302',
        statusDescription: 'Found',
      });
    });
  });

  test('test redirectToKeycloak idp', async () => {
    await redirectAuthServer.redirectToKeycloak({}, {
      kc_idp_hint: 'idp',
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      sessionManager,
      logger: console,
    }, 'ttt', (error, resp) => {
      expect(resp).toEqual({
        body: 'Redirecting to OIDC provider',
        status: '302',
        statusDescription: 'Found',
      });
    });
  });


  test('test redirectToKeycloak2', async () => {
    await redirectAuthServer.redirectToKeycloak({ uri: '/manufacturer/test', querystring: 'redirectUri=/' }, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      sessionManager,
      logger: console,
    }, null, (error, resp) => {
      expect(resp).toEqual({
        body: 'Redirecting to OIDC provider',
        status: '302',
        statusDescription: 'Found',
      });
    });
  });

  test('test responseWithKeycloakRedirectToLoginPage', async () => {
    await redirectAuthServer.responseWithKeycloakRedirectToLoginPage({}, {
      keycloakJson: () => ({ realm: 'testRealm', resource: 'resource' }),
      sessionManager,
      request: {},
      logger: console,
    }, null, (error, response) => {
      expect(response);
    });
  });
});
