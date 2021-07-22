import jsonwebtoken from 'jsonwebtoken';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import KeyCloakCerts from 'get-keycloak-public-key';

import {AdapterContent, JWTToken, RefreshContext, RequestContent, TokenJson} from '../Options';

import {getKeycloakUrl, getUrl} from './KeycloakUtils';

export function decodeToken(tokenString:string):JWTToken {
  const token:any = jsonwebtoken.decode(tokenString, {complete: true});
  if (!token || !token.header) {
    throw new Error('invalid token (header part)');
  } else {
    const {kid} = token.header;
    const {alg} = token.header;
    if (alg.toLowerCase() === 'none' || !kid) {
      throw new Error('invalid token');
    }
    token.tokenString = tokenString;
  }
  return token;
}

async function getKeyFromKeycloak0(requestContent:RequestContent,
                                  options:AdapterContent,
                                  kid:string) {
  const kJson = await options.keycloakJson(options, requestContent);
  const keycloakUrl = new URL(getKeycloakUrl(kJson));
  keycloakUrl.pathname = keycloakUrl.pathname.replace('/auth', '');
  const publicKey = await KeyCloakCerts(getUrl(keycloakUrl.toString()),
      kJson.realm).fetch(kid);
  return publicKey;
}

async function getKeyFromKeycloak(requestContent:RequestContent,
                                  options:AdapterContent,
                                  kid:string) {
  const cache = options.cache;
  let publicKey = await cache.get('publicKey', kid);
  if (!publicKey) {
    publicKey = await getKeyFromKeycloak0(requestContent, options, kid);
    await cache.put('publicKey', kid, publicKey);
  }
  return publicKey;
}

export async function verifyToken(requestContent:RequestContent,
                                  options:AdapterContent):Promise<JWTToken> {
  const {kid} = requestContent.token.header;
  const {alg} = requestContent.token.header;
  // eslint-disable-next-line no-negated-condition
  if (!alg.toLowerCase().startsWith('hs')) {
    // fetch the PEM Public Key
    const key:jsonwebtoken.Secret = <jsonwebtoken.Secret> await getKeyFromKeycloak(requestContent, options, kid);
    try {
      // Verify and decode the token
      jsonwebtoken.verify(requestContent.token.tokenString, key);
      options.logger.debug('token verified successfully ');
      return requestContent.token;
    } catch (error) {
      // Token is not valid
      throw new Error(`invalid token: ${error}`);
    }
  } else {
    throw new Error('invalid token');
  }
}

export function isExpired(token:any) {
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return clockTimestamp > token.exp - 30;
}

export function transformResfreshToRequest(refreshContext:RefreshContext):RequestContent {
  return {
    tokenString: refreshContext.token.access_token,
    token: decodeToken(refreshContext.token.access_token),
    request: refreshContext.request,
    realm: refreshContext.realm,
  };
}

export function transformRequestToRefresh(token:TokenJson, requestContext:RequestContent):RefreshContext {
  return {
    token,
    request: requestContext.request,
    realm: requestContext.realm,
  };
}
