import {
  AdapterContent, Enforcer, EnforcerFunc, RequestContent,
} from '../Options';

import {EnforcerAction} from './Enforcer';

export class ResourceEnforcer implements EnforcerAction {
  constructor(options: AdapterContent) {
    this.options = options;
  }

  options:AdapterContent;


  async enforce(requestContent:RequestContent, enforcerFunc:EnforcerFunc): Promise<void> {
    const enforcer = await enforcerFunc(this.options, requestContent);
    if (!enforcer) {
      throw new Error('enforcer does not provided');
    }
    await this.options.resourceChecker.matchResource(requestContent, enforcer);
  }
}
