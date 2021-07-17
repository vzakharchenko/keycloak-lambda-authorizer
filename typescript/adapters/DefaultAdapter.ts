import {
    AdapterContent, EnforcerFunction, RequestContent, updateEnforce,
} from '../Options';
import { SecurityAdapter } from './SecurityAdapter';
import { decodeToken, verifyToken } from '../utils/TokenUtils';

export class DefaultAdapter implements SecurityAdapter {
    options: AdapterContent;

    constructor(options: AdapterContent) {
      this.options = options;
    }

    async validate(request: string|RequestContent, enforcer?:EnforcerFunction): Promise<RequestContent> {
        let requestContent:RequestContent;
        if (request instanceof String){
            const tokenString:string = <string>request;
            const token = decodeToken(tokenString);
            requestContent = {
                tokenString,
                token,
            };
        } else {
            requestContent=<RequestContent>request;
        }

      await verifyToken(requestContent, this.options);
      if (enforcer) {
        await this.options.enforcer.enforce(requestContent, updateEnforce(enforcer));
      }
      return requestContent;
    }
}
