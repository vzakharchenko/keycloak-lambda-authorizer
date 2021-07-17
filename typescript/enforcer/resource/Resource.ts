import {
  AdapterContent, Enforcer, RequestContent, SecurityResource,
} from '../../Options';

export interface ResourceChecker {
    matchResource(requestContent:RequestContent, enforcer?:Enforcer):Promise<any>;
    getResource(requestContent:RequestContent, permission:SecurityResource):Promise<any>
}

export class DefaultResourceChecker implements ResourceChecker {
    options:AdapterContent;

    constructor(options: AdapterContent) {
      this.options = options;
    }

    buildUri(resourceObject:SecurityResource):string {
      return Object.entries(resourceObject).map(([key, value]) => `${key}=${value}`).join('&');
    }

    async getResource(requestContent:RequestContent,
      resourceObject: SecurityResource): Promise<any> {
      const { realm, resource } = await this.options.keycloakJson(this.options, requestContent);
      const key = `${realm}:${resource}${JSON.stringify(resourceObject)}`;
      const { cache } = this.options;
      let resources = await cache.get('resource', key);
      if (!resources) {
        const umaResponse = await this.options.umaConfiguration
          .getUma2Configuration(requestContent);
        const resourceRegistrationEndpoint = `${umaResponse.resource_registration_endpoint}?${this.buildUri(resourceObject)}`;
        const serviceToken = await this.options.serviceAccount
          .getServiceAccountToken(requestContent);
        const res = await this.options.restClient.fetchData(resourceRegistrationEndpoint, 'GET', {
          Authorization: `Bearer ${serviceToken}`, // client authorizer
        });
        resources = JSON.parse(res);
        await cache.put('resource', key, JSON.stringify(resources));
      } else {
        resources = JSON.parse(resources);
      }
      return resources;
    }

    async matchResource(requestContent:RequestContent, enforcer?:Enforcer): Promise<any> {
      if (!enforcer) {
        throw new Error('enforcer does not exists');
      }
      const permissions = enforcer.resources || [];
      if (enforcer.resource) {
        permissions.push(enforcer.resource);
      }
      let resources:any[] = [];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < permissions.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const resourceJson = await this.getResource(requestContent, permissions[i]);
        if (enforcer.resourceHandler) {
          enforcer.resourceHandler(resourceJson, this.options);
        }
        resources = resources.concat(resourceJson);
      }
      let { payload } = requestContent.token;
      if (!payload.authorization) {
        const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
        const tkn = await this.options.clientAuthorization.getRPT(requestContent, enforcer);
        payload = tkn.decodedAccessToken;
      }
      let permission:any;
      const resource = resources.find((resId) => {
        const { authorization } = payload;
        if (authorization && authorization.permissions) {
          permission = authorization.permissions.find((p:any) => p.rsid === resId);
        }
        return permission;
      });
      const hasScope = !permissions.find((p) => p.scope)
            || permissions.every((p) => permission.scopes.includes(p.scope));
      if (!resource || !hasScope) {
        throw new Error('Access is denied');
      }
    }
}
