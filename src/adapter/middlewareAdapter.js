const { decode } = require('jsonwebtoken');
const { serviceAccountJWT } = require('../serviceAccount');

const { commonOptions } = require('../utils/optionsUtils');
const { jwksUrlResponse } = require('../Jwks');
const { adapter } = require('../keycloakAuthorizer');

const jwksRoute = new RegExp('(^)(\\/|)(/service/jwks)(/$|(\\?|$))', 'g');

const isJwksRoute = (req) => req.baseUrl.match(jwksRoute);

const jwks = (req, res, options) => res.json(jwksUrlResponse(options.keys.publicKey.key));

function getTokenString(req) {
  const tokenString = req.headers.authorization;
  if (!tokenString) {
    throw new Error('Expected \'event.authorizationToken\' parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
  }
  req.jwt = { token: match[1], payload: decode(match[1]) };
  return match[1];
}

async function middleware(keycloakJson, options, middlewareParams) {
  const newOptions = commonOptions(options, keycloakJson);
  if (newOptions.keys && newOptions.keys.publicKey && isJwksRoute(middlewareParams.request)) {
    jwks(middlewareParams.request, middlewareParams.response, newOptions);
    return;
  }
  try {
    await adapter(getTokenString(middlewareParams.request), keycloakJson, newOptions);
    // eslint-disable-next-line no-param-reassign
    middlewareParams.request.serviceAccountJWT = async () => await serviceAccountJWT(keycloakJson,
      newOptions);
    middlewareParams.next();
  } catch (e) {
    newOptions.logger.log(`Authorization error ${e}`);
    middlewareParams.response.status(403).end();
  }
}

function middlewareAdapter(keycloakJson, options) {
  return {
    async middleware(request, response, next) {
      await middleware(keycloakJson, options, { request, response, next });
    },
  };
}

module.exports = {
  middlewareAdapter,
};
