import { AdapterContent, RequestContent } from '../Options';

export interface ServiceAccount {
    getServiceAccountToken(requestContent:RequestContent):Promise<string>;
}

export class DefaultServiceAccount implements ServiceAccount {
    options:AdapterContent;

    constructor(options: AdapterContent) {
      this.options = options;
    }

    async getServiceAccountToken(requestContent:RequestContent): Promise<string> {
      const serviceAccountToken = await this.options
        .clientAuthorization.clientAuthentication(requestContent);
      return serviceAccountToken.access_token;
    }
}
