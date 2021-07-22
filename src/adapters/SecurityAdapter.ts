import {EnforcerFunction, RefreshContext, RequestContent, TokenJson} from '../Options';

export interface SecurityAdapter {
    validate(request: string|RequestContent, enforcer?:EnforcerFunction):Promise<RequestContent>;
    refreshToken(tokenJson:TokenJson|RefreshContext, enforcer?:EnforcerFunction):Promise<RefreshContext|null>;
}
