/* eslint-disable babel/camelcase, @typescript-eslint/ban-ts-comment
*/
import {AdapterCache} from './cache/AdapterCache';
import {RestCalls} from './utils/restCalls';
import {DefaultRestCalls} from './utils/DefaultRestCalls';
import {DefaultEnforcer, EnforcerAction} from './enforcer/Enforcer';
import {DefaultUmaConfiguration, UmaConfiguration} from './uma/UmaConfiguration';
import {ClientAuthorization, DefaultClientAuthorization} from './clients/ClientAuthorization';
import {DefaultJWKS, JWKS} from './jwks/JWKS';
import {DefaultServiceAccount, ServiceAccount} from './serviceaccount/ServiceAccount';
import {SecurityAdapter} from './adapters/SecurityAdapter';
import {DefaultAdapter} from './adapters/DefaultAdapter';
import {DefaultResourceChecker, ResourceChecker} from './enforcer/resource/Resource';
import {DefaultCache} from './cache/DefaultCache';
import {AwsAuthorizationEvent, AwsEvent} from './adapters/ApigatewayAdapter';

export type LoggerType = {
    log: (...data: any[]) => void,
    info: (...data: any[]) => void,
    warn: (...data: any[]) => void,
    error: (...data: any[]) => void,
    debug: (...data: any[]) => void,
}

export type RSAKey = {
    key: string,
    passphrase?: string;
}

export type ClientJwtKeys = {
    privateKey: RSAKey,
    publicKey: RSAKey,
}
export type KeycloakJsonStructure = {
    "realm": string,
    "auth-server-url": string,
    "ssl-required": string,
    "resource": string,
    "credentials"?: {
        "secret": string
    },
}

export type JWTToken = {
    payload: any,
    tokenString: string,
    header: {
        alg: string,
        kid: string,
    }
}

export type TokenJson = {
    access_token: any,
    refresh_token: any,
    decodedAccessToken: any,
    decodedRefreshToken: any,
    refresh_expires_in: number,
}

export type RequestContent = {
    tokenString: string,
    token: JWTToken,
    request?: AwsEvent | AwsAuthorizationEvent | any,
    realm?: string,
}

export type RequestContext = {
    tokenString?: string,
    token?: JWTToken,
    request?: AwsEvent | AwsAuthorizationEvent | any,
    realm?: string,
}

export type RefreshContext = {
    token: TokenJson,
    request?: any,
    realm?: string,
}

// eslint-disable-next-line no-use-before-define
export type keycloakJsonFunction = (options: AdapterContent, requestContent: RequestContent) =>
    Promise<KeycloakJsonStructure> | KeycloakJsonStructure;

export type SecurityResource = {
    name?: string,
    uri?: string,
    owner?: string,
    type?: string,
    scope?: string,
    matchingUri?: boolean,
    deep?: boolean,
    first?: number,
    max?: number,
};

// eslint-disable-next-line no-use-before-define
export type ResourceHandlerFunc = (resourceJson: any, options: AdapterContent) => void

export type ClientRole = {
    clientId: string,
    clientRole: string,
}

export type Enforcer = {
    realmRole?: string,
    clientRole?: ClientRole,
    clientId?: string,
    resource?: SecurityResource,
    resources?: SecurityResource[],
};

// eslint-disable-next-line no-use-before-define
export type EnforcerFunc = (options: AdapterContent, requestContent: RequestContent) =>
    (Promise<Enforcer> | Enforcer);
export type EnforcerFunction = (EnforcerFunc | Enforcer);

export type AdapterContent = {
    keys: ClientJwtKeys,
    keycloakJson: keycloakJsonFunction,
    logger: LoggerType,
    cache: AdapterCache,
    restClient: RestCalls,
    enforcer: EnforcerAction,
    umaConfiguration: UmaConfiguration,
    clientAuthorization: ClientAuthorization,
    serviceAccount: ServiceAccount,
    securityAdapter: SecurityAdapter,
    resourceChecker: ResourceChecker,
    jwks: JWKS,
}

export type AdapterDependencies = {
    keys?: ClientJwtKeys,
    keycloakJson: keycloakJsonFunction | KeycloakJsonStructure,
    cache?: AdapterCache,
    logger?: LoggerType,
    restClient?: RestCalls,
    enforcer?: EnforcerAction,
    umaConfiguration?: UmaConfiguration,
    clientAuthorization?: ClientAuthorization,
    serviceAccount?: ServiceAccount,
    securityAdapter?: SecurityAdapter,
    resourceChecker?: ResourceChecker,
    jwks?: JWKS,
}

export function updateEnforce(enf: EnforcerFunction): EnforcerFunc {
  if (typeof enf !== 'function') {
    return (adapterOptions: AdapterContent) => enf;
  }
  return enf;
}
export function updateOptions(opts: AdapterDependencies): AdapterContent {
  // @ts-ignore
  const options: AdapterContent = opts;
  if (typeof options.keycloakJson !== 'function') {
    const {keycloakJson} = options;
    options.keycloakJson = (adapterOptions: AdapterContent) => keycloakJson;
  }
  if (!options.restClient) {
    options.restClient = new DefaultRestCalls();
  }
  if (!options.enforcer) {
    options.enforcer = new DefaultEnforcer(options);
  }
  if (!options.umaConfiguration) {
    options.umaConfiguration = new DefaultUmaConfiguration(options);
  }
  if (!options.clientAuthorization) {
    options.clientAuthorization = new DefaultClientAuthorization(options);
  }
  if (!options.jwks) {
    options.jwks = new DefaultJWKS();
  }
  if (!options.serviceAccount) {
    options.serviceAccount = new DefaultServiceAccount(options);
  }
  if (!options.securityAdapter) {
    options.securityAdapter = new DefaultAdapter(options);
  }
  if (!options.resourceChecker) {
    options.resourceChecker = new DefaultResourceChecker(options);
  }
  if (!options.logger) {
    options.logger = console;
  }
  if (!options.cache) {
    options.cache = new DefaultCache();
  }
  return options;
}
