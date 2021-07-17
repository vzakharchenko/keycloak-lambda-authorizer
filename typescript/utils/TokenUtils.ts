import jsonwebtoken, {Secret} from 'jsonwebtoken';
// @ts-ignore
import KeyCloakCerts from 'get-keycloak-public-key';
import {AdapterContent, JWTToken, RequestContent} from '../Options';
import { getKeycloakUrl, getUrl } from './KeycloakUtils';

export function decodeToken(tokenString:string):JWTToken {
  const token:any = jsonwebtoken.decode(tokenString, { complete: true });
  if (!token || !token.header) {
    throw new Error('invalid token (header part)');
  } else {
    const { kid } = token.header;
    const { alg } = token.header;
    if (alg.toLowerCase() === 'none' || !kid) {
      throw new Error('invalid token');
    }
    token.tokenString = tokenString;
  }
  return token;
}

async function getKeyFromKeycloak(requestContent:RequestContent,
                                  options:AdapterContent,
                                  kid:string) {
  let cache = options.cache;
  let publicKey = await cache.get('publicKey', kid);
  if (!publicKey) {
    const kJson = await options.keycloakJson(options, requestContent);
    const keycloakUrl = new URL(getKeycloakUrl(kJson));
    keycloakUrl.pathname = keycloakUrl.pathname.replace('/auth', '');
    publicKey = await KeyCloakCerts(getUrl(keycloakUrl.toString()),
      kJson.realm).fetch(kid);
    await cache.put('publicKey', kid, publicKey);
  }
  return publicKey;
}

export async function verifyToken(requestContent:RequestContent,
                                  options:AdapterContent):Promise<JWTToken> {
  const { kid } = requestContent.token.header;
  const { alg } = requestContent.token.header;
  if (!alg.toLowerCase().startsWith('hs')) {
    // fetch the PEM Public Key
    const key:Secret = <Secret> await getKeyFromKeycloak(requestContent, options, kid);
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

export function isExpired(options:AdapterContent, token:any) {
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return clockTimestamp > token.exp - 30;
}