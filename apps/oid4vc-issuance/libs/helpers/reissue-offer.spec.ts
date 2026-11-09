/* eslint-disable camelcase */
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { buildReissueRequest, IssuanceSessionRecord } from './reissue-offer';

// A throwaway certificate made for these tests (public certificate only): C=IN, valid from 9 Nov 2026 to 9 Nov 2027.
const SIGNER = `-----BEGIN CERTIFICATE-----
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
const toBase64Der = (pem: string): string => pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');

const now = new Date('2026-11-10T12:00:00.000Z');
const GRANT = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';

function mdocCredential(country = 'IN'): Record<string, unknown> {
  return {
    credentialSupportedId: 'IbdicMdocPlatform-mdoc',
    format: 'mso_mdoc',
    signerOptions: { method: 'x5c', x5c: [toBase64Der(SIGNER)], keyId: 'ob_key' },
    payload: {
      namespaces: { 'org.iso.18013.5.1': { family_name: 'Sharma', issuing_country: country } },
      validityInfo: { validFrom: '2026-11-09T21:00:00.000Z', validUntil: '2026-12-09T21:00:00.000Z' }
    }
  };
}

function session(overrides: Record<string, unknown> = {}): IssuanceSessionRecord {
  return {
    id: 'session-1',
    issuerId: 'ibdic-platform-mdoc',
    state: 'Completed',
    expiresAt: '2026-11-10T11:00:00.000Z',
    issuanceMetadata: { credentials: [mdocCredential()], isRevocable: false },
    credentialOfferPayload: {
      credential_issuer: 'http://localhost:4001/oid4vci/ibdic-platform-mdoc',
      grants: { [GRANT]: { tx_code: { length: 4, input_mode: 'numeric' } } }
    },
    ...overrides
  } as unknown as IssuanceSessionRecord;
}

describe('buildReissueRequest', () => {
  it('rebuilds the offer for the same credentials with a new validity of the same length', () => {
    const request = buildReissueRequest(session(), {}, now);

    expect(request.publicIssuerId).toBe('ibdic-platform-mdoc');
    expect(request.preAuthorizedCodeFlowConfig).toEqual({
      authorizationServerUrl: 'http://localhost:4001/oid4vci/ibdic-platform-mdoc',
      txCode: { length: 4, input_mode: 'numeric' }
    });
    const [credential] = request.credentials;
    expect(credential.signerOptions.keyId).toBe('ob_key');
    expect(credential.payload.validityInfo).toEqual({
      validFrom: '2026-11-10T12:00:00.000Z',
      validUntil: '2026-12-10T12:00:00.000Z'
    });
    expect(credential.payload.namespaces).toEqual({
      'org.iso.18013.5.1': { family_name: 'Sharma', issuing_country: 'IN' }
    });
  });

  it('can start again from a failed or authorised-but-unused offer', () => {
    expect(() => buildReissueRequest(session({ state: 'Error' }), {}, now)).not.toThrow();
    expect(() => buildReissueRequest(session({ state: 'AccessTokenCreated' }), {}, now)).not.toThrow();
    const expired = session({ state: 'OfferCreated', expiresAt: '2026-11-10T10:00:00.000Z' });
    expect(() => buildReissueRequest(expired, {}, now)).not.toThrow();
  });

  it('refuses while the wallet can still use the offer', () => {
    const usable = session({ state: 'OfferUriRetrieved', expiresAt: '2026-11-10T13:00:00.000Z' });
    expect(() => buildReissueRequest(usable, {}, now)).toThrow(ConflictException);
  });

  it('refuses a revocable offer, one without credentials and one that was not pre-authorized', () => {
    const revocable = session({ issuanceMetadata: { credentials: [mdocCredential()], isRevocable: true } });
    expect(() => buildReissueRequest(revocable, {}, now)).toThrow('revocable');

    expect(() => buildReissueRequest(session({ issuanceMetadata: {} }), {}, now)).toThrow(NotFoundException);

    const authorizationCode = session({ credentialOfferPayload: { grants: { authorization_code: {} } } });
    expect(() => buildReissueRequest(authorizationCode, {}, now)).toThrow('pre-authorized');
  });

  it('refuses when the signing certificate is not valid now', () => {
    expect(() => buildReissueRequest(session(), {}, new Date('2028-01-01T00:00:00.000Z'))).toThrow('not valid now');
    expect(() => buildReissueRequest(session(), {}, new Date('2026-01-01T00:00:00.000Z'))).toThrow(
      UnprocessableEntityException
    );
  });

  it('keeps the new validity inside the certificate and checks the country again', () => {
    const request = buildReissueRequest(session(), {}, new Date('2027-11-01T00:00:00.000Z'));
    expect(request.credentials[0].payload.validityInfo?.validUntil).toBe('2027-11-09T19:35:28.000Z');

    const mismatch = session({ issuanceMetadata: { credentials: [mdocCredential('US')] } });
    expect(() => buildReissueRequest(mismatch, {}, now)).toThrow('must match');
  });

  it('uses a validity given by the caller when it fits the certificate', () => {
    const request = buildReissueRequest(
      session(),
      { validityInfo: { validFrom: '2026-11-11T00:00:00.000Z', validUntil: '2026-11-20T00:00:00.000Z' } },
      now
    );
    expect(request.credentials[0].payload.validityInfo).toEqual({
      validFrom: '2026-11-11T00:00:00.000Z',
      validUntil: '2026-11-20T00:00:00.000Z'
    });
    const tooLong = { validityInfo: { validFrom: '2026-11-11T00:00:00.000Z', validUntil: '2030-01-01T00:00:00.000Z' } };
    expect(() => buildReissueRequest(session(), tooLong, now)).toThrow(
      'must start and end inside the signing certificate'
    );
  });

  it('passes a credential of another format through unchanged', () => {
    const sdJwt = {
      credentialSupportedId: 'Id-sdjwt',
      format: 'vc+sd-jwt',
      signerOptions: { method: 'did' },
      payload: { vct: 'X' }
    };
    const request = buildReissueRequest(session({ issuanceMetadata: { credentials: [sdJwt] } }), {}, now);
    expect(request.credentials).toEqual([sdJwt]);
  });
});
