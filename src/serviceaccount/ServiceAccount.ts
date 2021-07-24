import {AdapterContent, RequestContent, RequestContext} from '../Options';

export interface ServiceAccount {
    getServiceAccountToken(requestContent?:RequestContext):Promise<string>;
}

export class DefaultServiceAccount implements ServiceAccount {
  options:AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
  }

  async getServiceAccountToken(requestContent?:RequestContext): Promise<string> {
    const serviceAccountToken = await this.options
        .clientAuthorization.clientAuthentication(<RequestContent> requestContent || {});
    return serviceAccountToken.access_token;
  }
}
