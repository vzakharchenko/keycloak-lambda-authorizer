/* eslint-disable require-await, @typescript-eslint/ban-ts-comment
 */

import {DefaultJWKS} from "./JWKS";

describe('JWKS tests', () => {
  beforeEach(async () => {
    // @ts-ignore
  });

  test('JWKS certificate ', async () => {
    expect(new DefaultJWKS().json({
      key: '-----BEGIN CERTIFICATE-----\n' +
          'MIIC/zCCAeegAwIBAgIUUvRwrdBmEPv0jAmnlBmtrF8WVlswDQYJKoZIhvcNAQEL\n' +
          'BQAwDzENMAsGA1UEAwwEdGVzdDAeFw0yMTA3MTkwODI3MjdaFw0yMjA3MTkwODI3\n' +
          'MjdaMA8xDTALBgNVBAMMBHRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK\n' +
          'AoIBAQCXZecvMBbLfNUhUxcxQbfSw9tYaQufuEOM20IK4qgskeWJEgeGahsxr9K1\n' +
          'TqS83YhQ8xJS3QANlZA1HWOgE1aEtAsXgoN7MNoyXBmh6wl6r68YIvYSpmEdACIY\n' +
          'QbZOaYp0lANaE3/tzWHhZrToJDfLFN/Q79KXHkTFhdr+GAIkQmZJcXr/gp0m9fJW\n' +
          'EhkJEvTNxBBFcZKkHDqudCsvO6jDhYw9xpfk3BIfMyQTzW6MCRXqibeQE1aIpvHR\n' +
          'e97bWtOGXaY6ETIGZJvX5A0fNGyRo5frpF8tlZJ2qaVCvhnciOOxPs9ibmndhrvm\n' +
          'nsDbwmpAJ1fY2a65TKIXlPVEKdxtAgMBAAGjUzBRMB0GA1UdDgQWBBSJEUCKDStV\n' +
          'JVrFXw1S7E+8DKnTyjAfBgNVHSMEGDAWgBSJEUCKDStVJVrFXw1S7E+8DKnTyjAP\n' +
          'BgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBRqXs/2QNy572l+u3T\n' +
          'nsujtt0Avqm1HE1fufsjd3wpIB75TmUjH4RS28HMSXvqeqc1z9tCaIo02OojHUtY\n' +
          'WEEvuu2qclxMekx2EjLSLbIGaWHFdlhskPNkh8BHMCU/8nE8a+7oc8xPtnwSJPxT\n' +
          'KWKDP2r3O8/fbGFKYvvwCaRy9ZvLFght5IYm+JZMDY7SjDBO0XRtu6qOjGgtLoMx\n' +
          'qcuZJB94a1heCVZwGpcGber/OHsnUe4owg74ZYLgBLkpTvbhVlUsWhjWbEpiDLcu\n' +
          'hjVfa3kUwa5D2zsfYrqaT3251o7MGMWhM3fVJMmS70LsIH8w8XQqcsfhfJENHACJ\n' +
          'UKGk\n' +
          '-----END CERTIFICATE-----\n',
    })).toEqual({
      keys: [
        {
          e: "AQAB",
          kty: "RSA",
          n: "AJdl5y8wFst81SFTFzFBt9LD21hpC5-4Q4zbQgriqCyR5YkSB4ZqGzGv0rVOpLzdiFDzElLdAA2VkDUdY6ATVoS0CxeCg3sw2jJcGaHrCXqvrxgi9hKmYR0AIhhBtk5pinSUA1oTf-3NYeFmtOgkN8sU39Dv0pceRMWF2v4YAiRCZklxev-CnSb18lYSGQkS9M3EEEVxkqQcOq50Ky87qMOFjD3Gl-TcEh8zJBPNbowJFeqJt5ATVoim8dF73tta04ZdpjoRMgZkm9fkDR80bJGjl-ukXy2VknappUK-GdyI47E-z2Juad2Gu-aewNvCakAnV9jZrrlMoheU9UQp3G0",
          use: "sig",
        },
      ],
    });
  });
  test('JWKS publicKey', async () => {
    expect(new DefaultJWKS().json({
      key: '-----BEGIN RSA PUBLIC KEY-----\n' +
          'MIIBCgKCAQEAl2XnLzAWy3zVIVMXMUG30sPbWGkLn7hDjNtCCuKoLJHliRIHhmob\n' +
          'Ma/StU6kvN2IUPMSUt0ADZWQNR1joBNWhLQLF4KDezDaMlwZoesJeq+vGCL2EqZh\n' +
          'HQAiGEG2TmmKdJQDWhN/7c1h4Wa06CQ3yxTf0O/Slx5ExYXa/hgCJEJmSXF6/4Kd\n' +
          'JvXyVhIZCRL0zcQQRXGSpBw6rnQrLzuow4WMPcaX5NwSHzMkE81ujAkV6om3kBNW\n' +
          'iKbx0Xve21rThl2mOhEyBmSb1+QNHzRskaOX66RfLZWSdqmlQr4Z3IjjsT7PYm5p\n' +
          '3Ya75p7A28JqQCdX2NmuuUyiF5T1RCncbQIDAQAB\n' +
          '-----END RSA PUBLIC KEY-----\n',
    })).toEqual({
      keys: [
        {
          e: "AQAB",
          kty: "RSA",
          n: "AJdl5y8wFst81SFTFzFBt9LD21hpC5-4Q4zbQgriqCyR5YkSB4ZqGzGv0rVOpLzdiFDzElLdAA2VkDUdY6ATVoS0CxeCg3sw2jJcGaHrCXqvrxgi9hKmYR0AIhhBtk5pinSUA1oTf-3NYeFmtOgkN8sU39Dv0pceRMWF2v4YAiRCZklxev-CnSb18lYSGQkS9M3EEEVxkqQcOq50Ky87qMOFjD3Gl-TcEh8zJBPNbowJFeqJt5ATVoim8dF73tta04ZdpjoRMgZkm9fkDR80bJGjl-ukXy2VknappUK-GdyI47E-z2Juad2Gu-aewNvCakAnV9jZrrlMoheU9UQp3G0",
          use: "sig",
        },
      ],
    });
  });

});
