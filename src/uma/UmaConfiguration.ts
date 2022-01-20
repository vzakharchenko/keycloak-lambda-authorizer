import {AdapterContent, RequestContent} from '../Options';
import {getKeycloakUrl} from '../utils/KeycloakUtils';

export type UMAResponse = {
    issuer:string,
    authorization_endpoint:string,
    token_endpoint:string,
    introspection_endpoint:string,
    end_session_endpoint:string,
    jwks_uri:string,
    grant_types_supported:[string],
    response_types_supported: [string],
    response_modes_supported:[string],
    registration_endpoint:string,
    token_endpoint_auth_methods_supported:[string],
    token_endpoint_auth_signing_alg_values_supported:[string],
    scopes_supported:[string],
    resource_registration_endpoint:string,
    permission_endpoint:string,
    policy_endpoint:string,
}
export interface UmaConfiguration {
    getUma2Configuration(requestContent:RequestContent):Promise<UMAResponse>;
}

export class DefaultUmaConfiguration implements UmaConfiguration {
  options: AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
  }

  async getUma2Configuration(requestContent:RequestContent): Promise<UMAResponse> {
    const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
    const {realm} = keycloakJson;
    const {cache} = this.options;
    let uma2Config = await cache.get('uma2-configuration', realm);
    if (!uma2Config) {
      const res = await this.options.restClient
          .fetchData(`${getKeycloakUrl(keycloakJson)}/realms/${realm}/.well-known/uma2-configuration`);
      uma2Config = res;
      await cache.put('uma2-configuration', realm, res);
    }
    return JSON.parse(uma2Config);
  }
}
