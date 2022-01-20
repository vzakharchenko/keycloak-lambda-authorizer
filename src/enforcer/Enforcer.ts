import {
  AdapterContent, Enforcer, EnforcerFunc, EnforcerFunction, RequestContent,
} from '../Options';

import {RealmRoleEnforcer} from './RealmRoleEnforcer';
import {ClientRoleEnforcer} from './ClientRoleEnforcer';
import {ResourceEnforcer} from './ResourceEnforcer';

export interface EnforcerAction {
    enforce(requestContent: RequestContent, enforcer:EnforcerFunc): Promise<void>
}

export class DefaultEnforcer implements EnforcerAction {
  constructor(options: AdapterContent) {
    this.options = options;
    this.realmEnforcer = new RealmRoleEnforcer(options);
    this.clientEnforcer = new ClientRoleEnforcer(options);
    this.resourceEnforcer = new ResourceEnforcer(options);
  }

  options: AdapterContent;

  realmEnforcer: EnforcerAction;

  clientEnforcer: EnforcerAction;

  resourceEnforcer: EnforcerAction;


  async enforce(requestContent: RequestContent, enforcerFunc:EnforcerFunc): Promise<void> {
    const enforcer = await enforcerFunc(this.options, requestContent);
    if (!enforcer) {
      throw new Error('enforcer does not provided');
    }

    if (enforcer.realmRole) {
      await this.realmEnforcer.enforce(requestContent, enforcerFunc);
    } else if (enforcer.clientRole) {
      await this.clientEnforcer.enforce(requestContent, enforcerFunc);
    } else {
      await this.resourceEnforcer.enforce(requestContent, enforcerFunc);
    }
  }
}
