import {
    AdapterContent, EnforcerFunction, RequestContent, updateEnforce,
} from '../Options';
import {decodeToken, verifyToken} from '../utils/TokenUtils';

import {SecurityAdapter} from './SecurityAdapter';

export class DefaultAdapter implements SecurityAdapter {
  options: AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
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
