const jwt = require('jsonwebtoken');
const { clientJWT } = require('../clientAuthorization');

const { getUrl } = require('../utils/restCalls');

function getHostHeader(request) {
  return request.headers && request.headers.referer ? request.headers.referer[0].value : '';
}

function isLocalhost(request) {
  const hostHeaderValue = getHostHeader(request);
  return !hostHeaderValue || hostHeaderValue.startsWith('http://localhost');
}

function getHostUrl(request) {
  return getUrl(getHostHeader(request));
}

function updateResponse(request, response) {
  if (response.headers && response.headers['set-cookie']) {
    response.headers['set-cookie'].forEach((hn) => {
      // eslint-disable-next-line no-param-reassign
      hn.value = `${hn.value}${isLocalhost(request) ? '' : `; Domain=${getHostHeader(request)}; Secure`}`;
    });
  }
}

function tenantName(keycloakJson) {
  return `${keycloakJson.realm}-${keycloakJson.resource}`;
}

async function validateState(state, options) {
  if (!state) {
    return null;
  }
  const stateJWT = jwt.decode(state, { complete: true });
  if (!stateJWT || !stateJWT.header) {
    throw new Error('invalid token (header part)');
  } else {
    const { alg } = stateJWT.header;
    if (alg.toLowerCase() !== 'none' && !alg.toLowerCase().startsWith('hs')) {
      try {
        // const hostHeader = getHostHeader(request);
        // if (hostHeader && hostHeader !== sessionJWT.payload.sub) {
        //   throw new Error(errorWithoutRefresh('invalid token'));
        // }
        // Verify and decode the token
        const decoded = jwt.verify(state, options.sessionManager.sessionOptions.keys.publicKey.key);
        return decoded.n === tenantName(options.keycloakJson) ? decoded : null;
      } catch (error) {
        // Token is not valid
        options.logger.error(`invalid token ${error}`);
        return null;
      }
    } else {
      throw new Error('invalid token');
    }
  }
}


async function signState(state, options) {
  const timeLocal = new Date().getTime();
  const timeSec = Math.floor(timeLocal / 1000);
  const payload = {
    s: state,
    n: tenantName(options.keycloakJson),
    exp: timeSec + 600,
  };
  const jwtToken = await clientJWT(payload, options.sessionManager.sessionOptions);
  return jwtToken;
}

module.exports = {
  updateResponse,
  getHostUrl,
  tenantName,
  isLocalhost,
  validateState,
  signState,
};
