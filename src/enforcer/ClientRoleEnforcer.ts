import {
  AdapterContent, Enforcer, EnforcerFunc, EnforcerFunction, RequestContent,
} from '../Options';

import {EnforcerAction} from './Enforcer';

export class ClientRoleEnforcer implements EnforcerAction {
  options:AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
  }

  async enforce(requestContent:RequestContent, enforcerFunc:EnforcerFunc): Promise<void> {
    const enforcer = await enforcerFunc(this.options, requestContent);
    if (!enforcer) {
      throw new Error('enforcer does not provided');
    }
    if (!enforcer.clientRole) {
      throw new Error('Client Role is Empty');
    }
    const resourceAccess = requestContent.token.payload.resource_access[enforcer.clientRole.clientId];
    if (!resourceAccess) {
      throw new Error('Access Denied');
    }
    const {roles} = resourceAccess;
    const role = roles.find(
        (r:string) => r === enforcer.clientRole?.clientRole,
      );
    if (!role) {
      throw new Error('Access Denied');
    }
  }
}
