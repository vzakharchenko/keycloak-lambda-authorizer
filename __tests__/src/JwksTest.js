jest.mock('node-forge');
jest.mock('rsa-pem-to-jwk');

const forge = require('node-forge');
const rsaPemToJwk = require('rsa-pem-to-jwk');

const {jwksUrlResponse} = require('../../src/Jwks');

describe('testing Jwks', () => {
  beforeEach(() => {
    forge.pki.certificateFromPem.mockImplementation(() => ({
      publicKey: 'certificateFromPem',
    }));
    forge.pki.publicKeyToRSAPublicKeyPem.mockImplementation(() => 'publicKey');
    rsaPemToJwk.mockImplementation(() => 'test');
  });

  afterEach(() => {
  });

  test('test jwksUrlResponse Certificate', async () => {
    const s = jwksUrlResponse('publicCertificate');
    expect(s).toEqual('{"keys":["test"]}');
  });

  test('test jwksUrlResponse PublicKey', async () => {
    const s = jwksUrlResponse('-----BEGIN RSA PUBLIC KEY-----');
    expect(s).toEqual('{"keys":["test"]}');
  });
});
