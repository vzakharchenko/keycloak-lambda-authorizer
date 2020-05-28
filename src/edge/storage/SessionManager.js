const jwt = require('jsonwebtoken');

const { tenantName } = require('../lambdaEdgeUtils');

const { decodeAccessToken } = require('../../utils/TokenUtils');
const { clientJWT } = require('../../clientAuthorization');

function getSessionId(session) {
  return jwt.decode(session).jti;
}

function updateStorageToken(externalToken) {
  const token = JSON.parse(JSON.stringify(externalToken));
  delete token.upgraded;
  delete token.access_token;
  delete token.expires_in;
  delete token.refresh_expires_in;
  delete token.token_type;
  delete token.id_token;
  delete token['not-before-policy'];
  delete token.scope;
  return token;
}

function checkSession(sessionOptions) {
  return async (sessionString) => {
    if (!sessionString) {
      return null;
    }
    const sessionJWT = jwt.decode(sessionString, { complete: true });
    if (!sessionJWT || !sessionJWT.header) {
      throw new Error('invalid token (header part)');
    } else {
      const { alg } = sessionJWT.header;
      if (alg.toLowerCase() !== 'none' && !alg.toLowerCase().startsWith('hs')) {
        try {
          // const hostHeader = getHostHeader(request);
          // if (hostHeader && hostHeader !== sessionJWT.payload.sub) {
          //   throw new Error(errorWithoutRefresh('invalid token'));
          // }
          // Verify and decode the token
          const decoded = jwt.verify(sessionString, sessionOptions.keys.publicKey.key);
          return decoded;
        } catch (error) {
          // Token is not valid
          console.error(`invalid token ${error}`);
          return null;
        }
      } else {
        throw new Error('invalid token');
      }
    }
  };
}


async function createSessionToken(host, timeout, token, options) {
  const decodedjwt = decodeAccessToken(token).accessTokenDecode;
  const timeLocal = new Date().getTime();
  const timeSec = Math.floor(timeLocal / 1000);
  const sessionId = decodedjwt.session_state;
  const keycloakJson = options.keycloakJson(options);
  const tn = tenantName(keycloakJson);
  const payload = {
    jti: decodedjwt.session_state,
    sub: host,
    exp: (timeSec + timeout),
    email: decodedjwt.email,
    upd: timeSec,
    iat: timeSec,
  };
  payload.tenants = {};
  payload.tenants[keycloakJson.realm] = {};
  payload.tenants[keycloakJson.realm][keycloakJson.resource] = {
    cookieName: `KEYCLOAK_AWS_${tn}`,
    session_state: decodedjwt.session_state,
    route: options.routePath,
  };
  const session = await clientJWT(payload, options);
  return {
    sessionId,
    session,
    exp: payload.exp,
    email: decodedjwt.email,
  };
}

function createSession(sessionStorage, sessionOptions) {
  return async (host, timeout, token, options) => {
    const newOptions = { ...options, ...sessionOptions };
    const sessionObject = await createSessionToken(host, timeout, token, newOptions);
    await sessionStorage.saveSession(
      sessionObject.sessionId,
      sessionObject.exp,
      tenantName(newOptions.keycloakJson(options)),
      updateStorageToken(token),
      options,
    );
    return sessionObject.session;
  };
}

function getSessionIfExists(sessionStorage) {
  return async (session, options) => sessionStorage
    .getSessionIfExists(
      getSessionId(session), options,
    );
}

function deleteSession(sessionStorage) {
  return async (session, options) => sessionStorage
    .deleteSession(
      getSessionId(session), options,
    );
}

function deleteTenantSession(sessionStorage, sessionOptions) {
  return async (session, options) => {
    const newOptions = { ...options, ...sessionOptions };
    const keycloakJson = options.keycloakJson(newOptions);
    const payload = jwt.decode(session);
    if (payload[keycloakJson.realm]) {
      delete (payload[keycloakJson.realm])[keycloakJson.resource];
    }
    const newSession = await clientJWT(payload, newOptions);
    return {
      sessionId: getSessionId(session),
      session: newSession,
      exp: payload.exp,
      email: payload.email,
    };
  };
}

async function updateSessionToken(session, token, options) {
  const keycloakJson = options.keycloakJson(options);
  const payload = jwt.decode(session);
  const sessionId = getSessionId(session);
  let newSession = session;
  if (!(payload.tenants
            && payload.tenants[keycloakJson.realm]
      && payload.tenants[keycloakJson.resource])) {
    const tn = tenantName(keycloakJson);
    const timeLocal = new Date().getTime();
    payload.upd = Math.floor(timeLocal / 1000);
    payload.tenants = payload.tenants || {};
    payload.tenants[keycloakJson.realm] = payload.tenants[keycloakJson.realm] || {};
    payload.tenants[keycloakJson.realm][keycloakJson.resource] = {
      cookieName: `KEYCLOAK_AWS_${tn}`,
      session_state: token.session_state,
      route: options.routePath,
    };
    newSession = await clientJWT(payload, options);
  }
  return {
    sessionId,
    session: newSession,
    exp: payload.exp,
    email: payload.email,
  };
}

function modifySession(sessionStorage, sessionOptions) {
  return async (session, token, options) => {
    const newOptions = { ...options, ...sessionOptions };
    const sessionObject = await updateSessionToken(session, token, newOptions);
    return sessionObject.session;
  };
}
function updateSession(sessionStorage) {
  return async (session, tenant, token, options) => {
    await sessionStorage
      .updateSession(getSessionId(session), tenant, updateStorageToken(token), options);
  };
}

function SessionManager(sessionStorage, sessionOptions) {
  return {
    sessionStorage,
    checkSession: checkSession(sessionOptions),
    sessionOptions,
    getSessionIfExists: getSessionIfExists(sessionStorage),
    updateSession: updateSession(sessionStorage, sessionOptions),
    updateSessionToken: modifySession(sessionStorage, sessionOptions),
    deleteSession: deleteSession(sessionStorage),
    deleteTenantSession: deleteTenantSession(sessionStorage, sessionOptions),
    createSession: createSession(sessionStorage, sessionOptions),
  };
}

module.exports = {
  SessionManager,
};
