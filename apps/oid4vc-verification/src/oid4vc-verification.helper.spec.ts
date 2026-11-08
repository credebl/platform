import { buildVerificationSessionResult } from './oid4vc-verification.helper';

describe('buildVerificationSessionResult', () => {
  it('marks a ResponseVerified session as verified', () => {
    const result = buildVerificationSessionResult({
      id: 'session-id',
      state: 'ResponseVerified',
      errorMessage: null
    });

    expect(result).toMatchObject({
      id: 'session-id',
      responseStatus: 'ResponseVerified',
      verificationStatus: 'verified',
      verified: true,
      error: null
    });
  });

  it('marks an Error session as failed and exposes the error message', () => {
    const result = buildVerificationSessionResult({
      id: 'session-id',
      state: 'Error',
      errorMessage: 'Status is not valid'
    });

    expect(result).toMatchObject({
      responseStatus: 'Error',
      verificationStatus: 'failed',
      verified: false,
      error: 'Status is not valid'
    });
  });

  it('marks a pending session as pending', () => {
    const result = buildVerificationSessionResult({
      id: 'session-id',
      state: 'RequestCreated'
    });

    expect(result).toMatchObject({
      responseStatus: 'RequestCreated',
      verificationStatus: 'pending',
      verified: false,
      error: null
    });
  });

  it('preserves the stored response fields', () => {
    const result = buildVerificationSessionResult(
      {
        verificationSessionId: 'session-id',
        responseStatus: 'ResponseVerified',
        presentations: [{ encoded: 'presentation' }]
      },
      'ResponseVerified'
    );

    expect(result.presentations).toEqual([{ encoded: 'presentation' }]);
    expect(result.verificationSessionId).toBe('session-id');
    expect(result.verificationStatus).toBe('verified');
  });
});
