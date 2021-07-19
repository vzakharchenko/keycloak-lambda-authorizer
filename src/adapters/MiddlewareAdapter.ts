import {decode} from 'jsonwebtoken';

import {AdapterContent, EnforcerFunction, RequestContent} from '../Options';
import {decodeToken} from '../utils/TokenUtils';

type MiddlewareFunction = (request:any, response:any, next:any)=>Promise<void>

export interface MiddlewareAdapter {
    middleware(enforcer?:EnforcerFunction):MiddlewareFunction
}

export class DefaultMiddlewareAdapter implements MiddlewareAdapter {
  options:AdapterContent;

  jwksRoute = new RegExp('(^)(\\/|)(/service/jwks)(/$|(\\?|$))', 'g');

  constructor(options: AdapterContent) {
    this.options = options;
  }

  isJwksRoute(req:any):boolean {
    return (req.baseUrl || req.originalUrl).match(this.jwksRoute);
  }

  getTokenString(req:any) {
    const tokenString = req.headers.authorization;
    if (!tokenString) {
      throw new Error('Expected \'headers.authorization\' parameter to be set');
    }
    const match = tokenString.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
      throw new Error(`Invalid Authorization token - '${tokenString}' does not match 'Bearer .*'`);
    }
    req.jwt = {token: match[1], payload: decode(match[1])};
    return match[1];
  }

  middleware(enforcer?:EnforcerFunction): MiddlewareFunction {
    const {securityAdapter} = this.options;
    return async (request:any, response:any, next:any) => {
      if (this.options.keys && this.options.keys.publicKey && this.isJwksRoute(request)) {
        response.json(await this.options.jwks.json(this.options.keys.publicKey));
        return;
      }
      try {
        const tokenString = this.getTokenString(request);
        const requestContent:RequestContent = {
          tokenString,
          token: decodeToken(tokenString),
          request,
        };
        await securityAdapter
          .validate(requestContent, enforcer);
        const {serviceAccount} = this.options;
        request.serviceAccountJWT = async () => await serviceAccount
            .getServiceAccountToken(requestContent);
        next();
      } catch (e) {
        this.options.logger.log(`Authorization error ${e}`);
        response.status(403).end();
      }
    };
  }
}
