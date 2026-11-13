import { checkMdocIssuance, countryOfCertificate } from './mdoc-preflight';

// Throwaway certificates made for these tests (public certificates only).
// Subject C=IN, O=Test, CN=ibdic.in
const WITH_COUNTRY = `-----BEGIN CERTIFICATE-----
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
// Subject O=Test, CN=studio-test-leaf.example.com: no country
const WITHOUT_COUNTRY = `-----BEGIN CERTIFICATE-----
MIIB5zCCAYygAwIBAgIJAJ2JCHv+JYFFMAoGCCqGSM49BAMCMC4xDTALBgNVBAoM
BFRlc3QxHTAbBgNVBAMMFFRlc3QgSW50ZXJtZWRpYXRlIENBMB4XDTI2MTEwOTE3
MDczMFoXDTI3MTEwOTE3MDczMFowNjENMAsGA1UECgwEVGVzdDElMCMGA1UEAwwc
c3R1ZGlvLXRlc3QtbGVhZi5leGFtcGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49
AwEHA0IABP2QANY1FnQ+HLkAE7h1CA33APQE1EEOWxaWQ6vOdS9LpKQJ9WgD9ggk
FKXLStN8yToa83Jh1Y7dz0AQZkmrSIijgYowgYcwDAYDVR0TAQH/BAIwADAOBgNV
HQ8BAf8EBAMCB4AwJwYDVR0RBCAwHoIcc3R1ZGlvLXRlc3QtbGVhZi5leGFtcGxl
LmNvbTAdBgNVHQ4EFgQUxLl9NUvT77thhobckT+Py2psxX4wHwYDVR0jBBgwFoAU
G7ZRt+wbIDUB8VJJtJNq7+ZoRsYwCgYIKoZIzj0EAwIDSQAwRgIhAKYlvxbPq+7Z
GDTQQY5a8DvT7mxIPj1Ft+hBUIRgSMIvAiEAsHr6AGzDrj7gBWsrkBgSsmhCirmm
cLaifp5mjD6+5Zk=
-----END CERTIFICATE-----`;
const toBase64Der = (pem: string): string => pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');

// The claim names are the standard ISO/IEC 18013-5 ones.
/* eslint-disable camelcase */
const payload = (country?: string): Record<string, unknown> => ({
  namespaces: { 'org.iso.18013.5.1': { family_name: 'Sharma', ...(country ? { issuing_country: country } : {}) } }
});

/* eslint-enable camelcase */

describe('countryOfCertificate', () => {
  it('reads the country of a certificate', () => {
    expect(countryOfCertificate(toBase64Der(WITH_COUNTRY))).toBe('IN');
  });

  it('has none for a certificate without one or that cannot be read', () => {
    expect(countryOfCertificate(toBase64Der(WITHOUT_COUNTRY))).toBeUndefined();
    expect(countryOfCertificate('not a certificate')).toBeUndefined();
  });
});

describe('checkMdocIssuance', () => {
  it('has no problem when the countries match, or the credential names none', () => {
    expect(checkMdocIssuance(toBase64Der(WITH_COUNTRY), payload('IN'))).toEqual([]);
    expect(checkMdocIssuance(toBase64Der(WITH_COUNTRY), payload())).toEqual([]);
  });

  it('reports a signing certificate without a country', () => {
    const problems = checkMdocIssuance(toBase64Der(WITHOUT_COUNTRY), payload('IN'));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('has no country (C)');
  });

  it('reports an issuing country that differs from the certificate', () => {
    const problems = checkMdocIssuance(toBase64Der(WITH_COUNTRY), payload('US'));
    const expected =
      'issuing_country in org.iso.18013.5.1 is "US" but the signing certificate\'s country is "IN". They must match.';
    expect(problems).toEqual([expected]);
  });

  it('copes with a payload that has no namespaces', () => {
    expect(checkMdocIssuance(toBase64Der(WITH_COUNTRY), {})).toEqual([]);
  });
});
