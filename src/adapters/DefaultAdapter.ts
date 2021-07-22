import {
  AdapterContent, EnforcerFunction, RefreshContext, RequestContent, TokenJson, updateEnforce,
} from '../Options';
import {decodeToken, verifyToken} from '../utils/TokenUtils';

import {SecurityAdapter} from './SecurityAdapter';

export class DefaultAdapter implements SecurityAdapter {
  options: AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
  }

  async refreshToken(tokenJson: TokenJson|RefreshContext, enforcer?:EnforcerFunction): Promise<RefreshContext|null> {
    let refreshContext:RefreshContext;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (tokenJson.access_token) {
      refreshContext = {
        token: <TokenJson>tokenJson,
      };
    } else {
      refreshContext = <RefreshContext> tokenJson;
    }
    return await this.options.clientAuthorization.keycloakRefreshToken(refreshContext, enforcer ? updateEnforce(enforcer) : undefined);
  }

  async validate(request: string|RequestContent, enforcer?:EnforcerFunction): Promise<RequestContent> {
    let requestContent:RequestContent;
    if (request instanceof String || typeof request === 'string') {
      const tokenString:string = <string>request;
      const token = decodeToken(tokenString);
      requestContent = {
        tokenString,
        token,
      };
    } else {
      requestContent = <RequestContent>request;
    }

    await verifyToken(requestContent, this.options);
    if (enforcer) {
      await this.options.enforcer.enforce(requestContent, updateEnforce(enforcer));
    }
    return requestContent;
  }
}
