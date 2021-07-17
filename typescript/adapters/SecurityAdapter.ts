import { EnforcerFunction, RequestContent } from '../Options';

export interface SecurityAdapter {
    validate(request: string|RequestContent, enforcer?:EnforcerFunction):Promise<RequestContent>;
}
