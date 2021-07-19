/* eslint-disable  require-await, no-empty-function, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-empty-function
 */

import {AdapterCache} from "../cache/AdapterCache";
import {ClientAuthorization, JWSPayload} from "../clients/ClientAuthorization";
import {Enforcer, RequestContent, RSAKey, TokenJson} from "../Options";

import {isExpired} from "./TokenUtils";
import {HTTPMethod, RestCalls} from "./restCalls";

export class DummyCache implements AdapterCache {
  value?:string;

  constructor(value?: string) {
    this.value = value;
  }

  get(region: string, key: string): string | undefined {
    return this.value;
  }

  put(region: string, key: string, value: any, ttl?: number): void {

  }

}

export class DummyRestCalls implements RestCalls {

  resp?:string;


  constructor(resp?: string) {
    this.resp = resp;
  }

  async fetchData(url: string, method?: HTTPMethod, headers?: any): Promise<string> {
    return this.resp || '{}';
  }

  async sendData(url: string, method: HTTPMethod, data: string, headers?: any): Promise<string> {
    return this.resp || '{}';
  }

}

export class DummyClientAuthorization implements ClientAuthorization {
  token?:any;
  stringValue?:string;

  constructor(token?: any, stringValue?:string) {
    this.token = token;
    this.stringValue = stringValue;
  }

  async clientAuthentication(requestContent: RequestContent): Promise<any> {
    return this.token;
  }

  clientIdAuthorization(requestContent: RequestContent): Promise<any> {
    return this.token;
  }

  async clientJWT(payload: any, privateKey: RSAKey): Promise<string> {
    // @ts-ignore
    return this.stringValue;
  }

  async createJWS(requestContent: RequestContent): Promise<JWSPayload> {
    // @ts-ignore
    return {jti: this.stringValue};
  }

  async exchangeRPT(requestContent: RequestContent, accessToken: string, clientId: string): Promise<any> {
    return this.token;
  }

  async getRPT(requestContent: RequestContent, enforcer: Enforcer): Promise<any> {
    return this.token;
  }

  async getTokenByCode(requestContent: RequestContent, code: string, host: string): Promise<TokenJson> {
    // @ts-ignore
    // eslint-disable-next-line babel/camelcase
    return {access_token: this.token, refresh_token: this.token};
  }

  async keycloakRefreshToken(token: TokenJson, requestContent: RequestContent, enforcer?: Enforcer): Promise<any> {
    return this.token;
  }

  async logout(requestContent: RequestContent, refreshToken: any): Promise<void> {

  }

}

describe('Dummy tests', () => {
  test('Dummy test', () => {
    expect(1).toEqual(1);
  });
});
