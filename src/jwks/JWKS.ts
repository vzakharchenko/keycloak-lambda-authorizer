import forge from 'node-forge';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rsaPemToJwk from 'rsa-pem-to-jwk';

import {RSAKey} from '../Options';

export type JWKSType={
    keys:[any],
}

export interface JWKS {
    json(publicKey:RSAKey):Promise<JWKSType>| JWKSType;
}

export class DefaultJWKS implements JWKS {
  publicKeyTransform(publicKey:string):string {
    const m = /^-----BEGIN RSA PUBLIC KEY-----/.exec(publicKey);
    if (m) {
      return publicKey;
    }
    const certPem = forge.pki.certificateFromPem(publicKey);
    let p = forge.pki.publicKeyToRSAPublicKeyPem(certPem.publicKey);
    p = p.replace(/\r/g, '');
    return p;
  }

  json(publicKey: RSAKey): JWKSType {
    const newPk = this.publicKeyTransform(publicKey.key);
    return {keys: [rsaPemToJwk(newPk, {use: 'sig'}, 'public')]};
  }
}
