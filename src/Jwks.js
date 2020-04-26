const forge = require('node-forge');
const rsaPemToJwk = require('rsa-pem-to-jwk');

function publicKeyTransform(publicKey) {
  const m = /^-----BEGIN RSA PUBLIC KEY-----/.exec(publicKey);
  if (m) {
    return publicKey;
  }
  const certPem = forge.pki.certificateFromPem(publicKey);
  let p = forge.pki.publicKeyToRSAPublicKeyPem(certPem.publicKey);
  p = p.replace(/\r/g, '');
  return p;
}

function jwksUrlResponse(publicKey) {
  const newPk = publicKeyTransform(publicKey);
  const pkey = JSON.stringify({ keys: [rsaPemToJwk(newPk, { use: 'sig' }, 'public')] });
  return pkey;
}

module.exports = {
  jwksUrlResponse,
};
