import { UnprocessableEntityException } from '@nestjs/common';
import { validateCertificateChain } from './certificate-chain';

// A throwaway chain made for these tests, public certificates only: root -> intermediate -> leaf (ECDSA P-256).
const ROOT = `-----BEGIN CERTIFICATE-----
MIIBgTCCASagAwIBAgIJAMkg9ilTnPp0MAoGCCqGSM49BAMCMDMxCzAJBgNVBAYT
AklOMQ0wCwYDVQQKDARUZXN0MRUwEwYDVQQDDAxUZXN0IFJvb3QgQ0EwHhcNMjYx
MTA5MTkzNTI4WhcNMzYxMTA2MTkzNTI4WjAzMQswCQYDVQQGEwJJTjENMAsGA1UE
CgwEVGVzdDEVMBMGA1UEAwwMVGVzdCBSb290IENBMFkwEwYHKoZIzj0CAQYIKoZI
zj0DAQcDQgAEJ5b6SLVI4wxOiMYnFiKbxIQMjcZFijyfp/iRQpcuUTzmSDS2kVUr
6z6WN+LZ02oJFER+xmAlSn4kA7T6WrPf/6MjMCEwDwYDVR0TAQH/BAUwAwEB/zAO
BgNVHQ8BAf8EBAMCAQYwCgYIKoZIzj0EAwIDSQAwRgIhALK6zDRvJn8J/IwbippN
U8k3cpzqTC5Ek4hTjgHceNjDAiEA3P3wQuKJyOhkMNnpCUgkS0/D1HEp0Em8z+IE
0qWesdw=
-----END CERTIFICATE-----`;
const INTERMEDIATE = `-----BEGIN CERTIFICATE-----
MIIBtjCCAVugAwIBAgIJAO9vl1qkmNpmMAoGCCqGSM49BAMCMDMxCzAJBgNVBAYT
AklOMQ0wCwYDVQQKDARUZXN0MRUwEwYDVQQDDAxUZXN0IFJvb3QgQ0EwHhcNMjYx
MTA5MTkzNTI4WhcNMzExMTA4MTkzNTI4WjA7MQswCQYDVQQGEwJJTjENMAsGA1UE
CgwEVGVzdDEdMBsGA1UEAwwUVGVzdCBJbnRlcm1lZGlhdGUgQ0EwWTATBgcqhkjO
PQIBBggqhkjOPQMBBwNCAASkmdN599DWIGvkakZbLvLPGlwMMXdCchrxgoSaQkxe
AjOWB+e1ZCt5dM77HyZ+/OIqby72qEWJzn5WUJyHoU7Uo1AwTjASBgNVHRMBAf8E
CDAGAQH/AgEAMA4GA1UdDwEB/wQEAwIBBjAdBgNVHQ4EFgQUnQNReODyYV/HbK2C
eVRClPGKYH0wCQYDVR0jBAIwADAKBggqhkjOPQQDAgNJADBGAiEAvTsPOXPRrUiz
UwR54Dgm5yVquYwSqL7n+hvhtFTQtr4CIQCB8tRu248NKH2Zpuaos3SuJXZaLO2f
7Ic2RAFReH3jLg==
-----END CERTIFICATE-----`;
const LEAF = `-----BEGIN CERTIFICATE-----
MIIB1TCCAXygAwIBAgIJAJ26XMJqbrvmMAoGCCqGSM49BAMCMDsxCzAJBgNVBAYT
AklOMQ0wCwYDVQQKDARUZXN0MR0wGwYDVQQDDBRUZXN0IEludGVybWVkaWF0ZSBD
QTAeFw0yNjExMDkxOTM1MjhaFw0yNzExMDkxOTM1MjhaMC8xCzAJBgNVBAYTAklO
MQ0wCwYDVQQKDARUZXN0MREwDwYDVQQDDAhpYmRpYy5pbjBZMBMGByqGSM49AgEG
CCqGSM49AwEHA0IABF2SOmEKVhN2BG60E0TUfTAi7XV35VOsmSsx7hdJG+Qytzkz
UOx6c1m1A60Z+0BGBySoQWA1cJexVSNbPYyCuWejdTBzMAwGA1UdEwEB/wQCMAAw
DgYDVR0PAQH/BAQDAgeAMBMGA1UdEQQMMAqCCGliZGljLmluMB0GA1UdDgQWBBT5
0IhrfrSjQ2PJxSLqaLLcY0RHnzAfBgNVHSMEGDAWgBSdA1F44PJhX8dsrYJ5VEKU
8YpgfTAKBggqhkjOPQQDAgNHADBEAiBycobKJUAjNM+ffbGtIPHEl7ykUze+dRbe
LB+1+YOecgIgUx7+J5IHa6UvKp9QDNjF9qvjs0e1R/ReoFjt/vLTaP4=
-----END CERTIFICATE-----`;
// A certificate from another chain.
const UNRELATED = `-----BEGIN CERTIFICATE-----
MIIBfzCCASagAwIBAgIJAP7Wkl6b0XwKMAoGCCqGSM49BAMCMDMxCzAJBgNVBAYT
AklOMQ0wCwYDVQQKDARUZXN0MRUwEwYDVQQDDAxUZXN0IFJvb3QgQ0EwHhcNMjYx
MTA5MTkxMTA5WhcNMzYxMTA2MTkxMTA5WjAzMQswCQYDVQQGEwJJTjENMAsGA1UE
CgwEVGVzdDEVMBMGA1UEAwwMVGVzdCBSb290IENBMFkwEwYHKoZIzj0CAQYIKoZI
zj0DAQcDQgAEBlFtpm7DMpst31AHWYSFDRjVi4LbbPe7ayjgnsfXi6AjnNGbVM53
rDXiN0oQK7br1QKUUNrq9X9svyY9LJxvtqMjMCEwDwYDVR0TAQH/BAUwAwEB/zAO
BgNVHQ8BAf8EBAMCAQYwCgYIKoZIzj0EAwIDRwAwRAIgEFz0fw/y1vH1SLVbSz7E
NO631qxtoKifssVuD372i4gCIE/JalTr4Bt+ePfBbK1Xw+lG0z/PVlRaNNeXGB+g
HF7y
-----END CERTIFICATE-----`;

const toBase64Der = (pem: string): string => pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');

describe('validateCertificateChain', () => {
  it('accepts a chain in order and returns it as base64 DER', () => {
    expect(validateCertificateChain(toBase64Der(LEAF), [INTERMEDIATE, ROOT])).toEqual([
      toBase64Der(INTERMEDIATE),
      toBase64Der(ROOT)
    ]);
  });

  it('accepts base64 DER as well as PEM, and a chain without the root', () => {
    expect(validateCertificateChain(LEAF, [toBase64Der(INTERMEDIATE)])).toEqual([toBase64Der(INTERMEDIATE)]);
  });

  it('has no chain to keep when none is given', () => {
    expect(validateCertificateChain(toBase64Der(LEAF))).toEqual([]);
    expect(validateCertificateChain(toBase64Der(LEAF), [])).toEqual([]);
  });

  it('rejects a chain in the wrong order', () => {
    expect(() => validateCertificateChain(toBase64Der(LEAF), [ROOT, INTERMEDIATE])).toThrow(
      UnprocessableEntityException
    );
    expect(() => validateCertificateChain(toBase64Der(LEAF), [ROOT, INTERMEDIATE])).toThrow(
      'The certificate was not issued by certificateChain[0]'
    );
    expect(() => validateCertificateChain(toBase64Der(LEAF), [INTERMEDIATE, UNRELATED])).toThrow(
      'certificateChain[0] was not issued by certificateChain[1]'
    );
  });

  it('rejects a certificate that did not issue the one before it', () => {
    expect(() => validateCertificateChain(toBase64Der(LEAF), [UNRELATED])).toThrow('was not issued by');
  });

  it('rejects an entry that is not a certificate', () => {
    expect(() => validateCertificateChain(toBase64Der(LEAF), ['not a certificate'])).toThrow(
      'certificateChain[0] is not a valid X.509 certificate'
    );
  });
});
