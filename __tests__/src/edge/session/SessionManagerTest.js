jest.mock('jsonwebtoken');
jest.mock('../../../../src/clientAuthorization');
const jsonwebtoken = require('jsonwebtoken');

const { SessionManager } = require('../../../../src/edge/storage/SessionManager');
const { clientJWT } = require('../../../../src/clientAuthorization');

const sessionStorage = {
  saveSession: async () => {

  },
  updateSession: async () => {

  },
  getSessionIfExists: async () => 'test',
  deleteSession: async () => {

  },
};

describe('testing SessionManager', () => {
  beforeEach(() => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: { alg: 'rs256' },
    }));
    jsonwebtoken.verify.mockImplementation(() => ({
      n: 'undefined-undefined',
    }));
    clientJWT.mockImplementation(async () => 'SESSION_TOKEN');
  });

  afterEach(() => {
  });

  test('test sessionStorage', () => {
    const session = new SessionManager(sessionStorage);
    expect(session.sessionStorage).toEqual(sessionStorage);
  });

  test('test checkSession', async () => {
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } } });
    expect(await session.checkSession('TOKEN')).toEqual({
      n: 'undefined-undefined',
    });
  });

  test('test checkSession Failed', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: { alg: 'none' },
    }));
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } } });
    expect(await session.checkSession(null)).toEqual(null);
    try {
      expect(await session.checkSession('TOKEN')).toEqual(null);
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });

  test('test checkSession Failed 2', async () => {
    jsonwebtoken.decode.mockImplementation(() => ({
      header: { alg: 'hs256' },
    }));
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } } });
    try {
      expect(await session.checkSession('TOKEN')).toEqual(null);
    } catch (e) {
      expect(e.message).toEqual('invalid token');
    }
  });

  test('test sessionOptions ', async () => {
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } } });
    expect(session.sessionOptions).toEqual({ keys: { publicKey: { key: 'PUBLIC_KEY' } } });
  });

  test('test getSessionIfExists ', async () => {
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } } });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.getSessionIfExists('TEDT')).toEqual('test');
  });

  test('test updateSession ', async () => {
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } } });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.updateSession('TEDT', 'tenant', {})).toEqual(undefined);
  });

  test('test updateSession custom handler', async () => {
    const session = new SessionManager(sessionStorage, { keys: { publicKey: { key: 'PUBLIC_KEY' } }, sessionModify: (token) => token });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.updateSession('TEDT', 'tenant', {})).toEqual(undefined);
  });

  test('test updateSessionToken ', async () => {
    const session = new SessionManager(sessionStorage, {
      keycloakJson: () => ({}),
      keys: { publicKey: { key: 'PUBLIC_KEY' } },
    });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.updateSessionToken('TEDT', 'tenant', {})).toEqual('SESSION_TOKEN');
  });

  test('test updateSessionToken custom session handler', async () => {
    const session = new SessionManager(sessionStorage, {
      keycloakJson: () => ({}),
      keys: { publicKey: { key: 'PUBLIC_KEY' } },
      sessionModify: (token) => token,
    });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.updateSessionToken('TEDT', 'tenant', {})).toEqual('SESSION_TOKEN');
  });

  test('test deleteSession  custom session handler', async () => {
    const session = new SessionManager(sessionStorage, {
      keycloakJson: {},
      keys: { publicKey: { key: 'PUBLIC_KEY' } },
      sessionDelete: (token) => token,
    });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.deleteSession('TEDT')).toEqual(undefined);
  });

  test('test createSession ', async () => {
    const session = new SessionManager(sessionStorage, {
      keycloakJson: () => ({}),
      keys: { publicKey: { key: 'PUBLIC_KEY' } },
    });
    jsonwebtoken.decode.mockImplementation(() => ({
      jti: 'testId',
    }));
    expect(await session.createSession('host', 3, 'token', { keycloakJson: () => {} })).toEqual('SESSION_TOKEN');
  });
});
