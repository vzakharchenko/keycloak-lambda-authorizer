import jsonwebtoken from 'jsonwebtoken';
import jws from 'jws';
import {v4} from 'uuid';

import {
  AdapterContent, Enforcer, RequestContent, RSAKey, TokenJson,
} from '../Options';
import {getKeycloakUrl} from '../utils/KeycloakUtils';
import {isExpired} from '../utils/TokenUtils';

export type JWSPayload = {
    jti: string,
    sub: string,
    iss: string,
    aud: string,
    exp: number,
    iat: number,
}

export interface ClientAuthorization {
    clientIdAuthorization(requestContent:RequestContent):Promise<any>;
    clientJWT(payload:any, privateKey:RSAKey):Promise<string>;
    createJWS(requestContent:RequestContent):Promise<JWSPayload>;
    getTokenByCode(requestContent:RequestContent,
                   code:string,
                   host:string):Promise<TokenJson>;
    exchangeRPT(requestContent:RequestContent,
                accessToken:string, clientId:string):Promise<any>;
    keycloakRefreshToken(token:TokenJson,
                         requestContent:RequestContent,
                         enforcer?:Enforcer):Promise<any>;
    clientAuthentication(requestContent:RequestContent):Promise<any>;
    getRPT(requestContent: RequestContent, enforcer:Enforcer):Promise<any>;
    logout(requestContent: RequestContent, refreshToken:any):Promise<void>;
}

export class DefaultClientAuthorization implements ClientAuthorization {
  options:AdapterContent;

  constructor(options: AdapterContent) {
    this.options = options;
  }

  async clientAuthentication0(requestContent:RequestContent, token?:string): Promise<any> {
    const parsedToken = token ? JSON.parse(token) : null;
    const authorization = await this.clientIdAuthorization(requestContent);
    let data = `grant_type=client_credentials&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    if (token && parsedToken &&
            parsedToken.decodedRefreshToken &&
            !isExpired(parsedToken.decodedRefreshToken)) {
      data = `refresh_token=${JSON.parse(token).refresh_token}&grant_type=refresh_token&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    }
    const umaConfig = await this.options.umaConfiguration.getUma2Configuration(requestContent);
    const res = await this.options.restClient.sendData(`${umaConfig.token_endpoint}`, 'POST', data);
    const newToken = JSON.parse(res);
    newToken.decodedAccessToken = jsonwebtoken.decode(newToken.access_token);
    newToken.decodedRefreshToken = jsonwebtoken.decode(newToken.refresh_token);
    return newToken;
  }

  async clientAuthentication(requestContent:RequestContent): Promise<any> {
    const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
    const key = `${keycloakJson.realm}:${keycloakJson.resource}`;
    const {cache} = this.options;
    let token = await cache.get('client_credentials', key);
    if (!token || isExpired(JSON.parse(token).decodedAccessToken)) {
      const newToken = await this.clientAuthentication0(requestContent, token);
      token = JSON.stringify(newToken);
      await cache.put('client_credentials', key, token);
    }
    return JSON.parse(token);
  }

  async clientIdAuthorization(requestContent:RequestContent): Promise<string> {
    const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
    let authorization = `client_id=${keycloakJson.resource}`;
    if (keycloakJson.credentials && keycloakJson.credentials.secret) {
      authorization += `&client_secret=${keycloakJson.credentials.secret}`;
    } else
      if (this.options.keys && this.options.keys.privateKey) {
        authorization += `&client_assertion=${await this.clientJWT(await this.createJWS(requestContent),
          this.options.keys.privateKey)}`;
      } else {
        throw new Error('Unsupported Credential Type');
      }
    return authorization;
  }

  clientJWT(payload: any, privateKey: RSAKey): Promise<string> {
    return new Promise((resolve, reject) => {
      jws.createSign({
        header: {alg: 'RS256', typ: 'RSA'},
        privateKey,
        payload,
      }).on('done', (signature) => {
        resolve(signature);
      }).on('error', (e) => {
        this.options.logger.log(`error:${e}`);
        reject(e);
      });
    });
  }

  async createJWS(requestContent:RequestContent): Promise<JWSPayload> {
    const timeLocal = new Date().getTime();
    const timeSec = Math.floor(timeLocal / 1000);
    const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
    return {
      jti: v4(),
      sub: keycloakJson.resource,
      iss: keycloakJson.resource,
      aud: `${getKeycloakUrl(keycloakJson)}/realms/${keycloakJson.realm}`,
      exp: timeSec + 30,
      iat: timeSec,
    };
  }

  async exchangeRPT(requestContent:RequestContent,
      accessToken: string,
      clientId: string): Promise<TokenJson> {
    const umaConfig = await this.options.umaConfiguration.getUma2Configuration(requestContent);
    const url = `${umaConfig.token_endpoint}`;
    const data = `grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&response_include_resource_name=false&audience=${clientId}`;
    try {
      const response = await this.options.restClient.sendData(url,
          'POST',
          data,
        {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        });
      return JSON.parse(response);
    } catch (e) {
      throw new Error(e);
    }
  }

  async getRPT(requestContent: RequestContent, enforcer:Enforcer): Promise<any> {
    const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
    const clientId = enforcer.clientId || keycloakJson.resource;
    const key = `${keycloakJson.realm}:${clientId}:${requestContent.token.payload.jti}`;
    const {cache} = this.options;
    const tkn = await cache.get('rpt', key);
    let tkn0;
    // eslint-disable-next-line no-negated-condition
    if (!tkn) {
      tkn0 = await this.exchangeRPT(requestContent,
          requestContent.tokenString, clientId);
      tkn0.decodedAccessToken = jsonwebtoken.decode(tkn0.access_token);
      tkn0.decodedRefreshToken = jsonwebtoken.decode(tkn0.refresh_token);
      await cache.put('rpt', key, JSON.stringify(tkn0), tkn0.refresh_expires_in);
    } else {
      const parseToken:TokenJson = JSON.parse(tkn);
      if (isExpired(parseToken.decodedAccessToken)) {
        if (parseToken.refresh_token) {
          tkn0 = await this.keycloakRefreshToken(parseToken, requestContent, enforcer);
        } else {
          tkn0 = await this.exchangeRPT(requestContent,
              requestContent.tokenString, clientId);
        }
        if (!tkn0) {
          throw new Error('Not able to refresh token');
        }
        tkn0.decodedAccessToken = jsonwebtoken.decode(tkn0.access_token);
        tkn0.decodedRefreshToken = jsonwebtoken.decode(tkn0.refresh_token);
        await cache.put('rpt', key, JSON.stringify(tkn0), tkn0.refresh_expires_in);
      } else {
        tkn0 = parseToken;
      }
    }
    return tkn0;
  }

  async getTokenByCode(requestContent:RequestContent,
      code: string,
      host: string): Promise<TokenJson> {
    const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
    const umaConfig = await this.options.umaConfiguration.getUma2Configuration(requestContent);
    const url = `${umaConfig.token_endpoint}`;
    const authorization = await this.clientIdAuthorization(requestContent);
    const data = `code=${code}&grant_type=authorization_code&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}&redirect_uri=${encodeURIComponent(`${host}/${keycloakJson.realm}/${keycloakJson.resource}/callback`)}`;
    const tokenResponse = await this.options.restClient.sendData(url,
        'POST',
        data,
        {'Content-Type': 'application/x-www-form-urlencoded'});
    const tokenJson:TokenJson = JSON.parse(tokenResponse);
    tokenJson.decodedAccessToken = jsonwebtoken.decode(tokenJson.access_token);
    tokenJson.decodedRefreshToken = jsonwebtoken.decode(tokenJson.refresh_token);
    return tokenJson;
  }

  async keycloakRefreshToken(token: TokenJson,
      requestContent:RequestContent,
      enforcer?:Enforcer): Promise<TokenJson|null> {
    let tokenJson:TokenJson = token;
    if (!tokenJson) {
      return null;
    }
    const decodedAccessToken = jsonwebtoken.decode(token.access_token);
    const decodedRefreshToken = jsonwebtoken.decode(token.refresh_token);
    if (isExpired(decodedRefreshToken)) {
      return null;
    }
    if (!decodedAccessToken || isExpired(decodedAccessToken)) {
      const keycloakJson = await this.options.keycloakJson(this.options, requestContent);
      const realmName = keycloakJson.realm;
      const umaConfig = await this.options.umaConfiguration.getUma2Configuration(requestContent);
      const url = `${umaConfig.token_endpoint}`;
      this.options.logger.debug(`Token Request Url: ${url}`);
      const authorization = await this.clientIdAuthorization(requestContent);
      const data = `refresh_token=${token.refresh_token}&grant_type=refresh_token&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
      try {
        const tokenResponse = await this.options.restClient.sendData(url,
            'POST',
            data,
            {'Content-Type': 'application/x-www-form-urlencoded'});
        tokenJson = JSON.parse(tokenResponse);
        if (enforcer &&
              !enforcer.realmRole && !enforcer.clientRole) {
          tokenJson = await this.exchangeRPT(requestContent, tokenJson.access_token,
              enforcer.clientId || keycloakJson.resource);
        }
      } catch (e) {
        this.options.logger.error(`wrong refresh token for ${realmName}`, e);
        return null;
      }
    }
    return tokenJson;
  }

  async logout(requestContent: RequestContent, refreshToken: any): Promise<void> {
    const authorization = await this.clientIdAuthorization(requestContent);
    const data = `refresh_token=${refreshToken}&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&${authorization}`;
    const umaConfig = await this.options.umaConfiguration.getUma2Configuration(requestContent);
    const url = `${umaConfig.end_session_endpoint}`;
    await this.options.restClient.sendData(url,
        'POST',
        data,
        {'Content-Type': 'application/x-www-form-urlencoded'});
  }
}
