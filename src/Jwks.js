import forge from 'node-forge';
import rsaPemToJwk from 'rsa-pem-to-jwk';

function publicKeyTransform(publicKey) {
  const m = /^-----BEGIN RSA PUBLIC KEY-----/.exec(publicKey);
  if (m) {
    return f;
  }
  const certPem = forge.pki.certificateFromPem(publicKey);
  let p = forge.pki.publicKeyToRSAPublicKeyPem(certPem.publicKey);
  p = p.replace(/\r/g, '');
  return p;
}

export function jwksUrlResponse(publicKey) {
  const newPk = publicKeyTransform(publicKey);
  const pkey = JSON.stringify({ keys: [rsaPemToJwk(newPk, { use: 'sig' }, 'public')] });
  return pkey;
}
