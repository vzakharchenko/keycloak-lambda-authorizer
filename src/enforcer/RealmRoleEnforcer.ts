import {
  AdapterContent, Enforcer, EnforcerFunc, RequestContent,
} from '../Options';

import {EnforcerAction} from './Enforcer';

export class RealmRoleEnforcer implements EnforcerAction {
  options:AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
  }

  async enforce(requestContent: RequestContent, enforcerFunc:EnforcerFunc): Promise<void> {
    const enforcer = await enforcerFunc(this.options, requestContent);
    if (!enforcer) {
      throw new Error('enforcer does not provided');
    }
    if (!enforcer.realmRole) {
      throw new Error('Realm Role is Empty');
    }
    const role = requestContent.token.payload.realm_access.roles.find(
        (r:string) => r === enforcer.realmRole,
      );
    if (!role) {
      throw new Error('Access Denied');
    }
  }
}
