import { Oid4vpVerificationService } from './oid4vc-verification.service';

describe('Oid4vpVerificationService verification responses', () => {
  let service: Oid4vpVerificationService;

  const repository = {
    getAgentEndPoint: jest.fn()
  };
  const natsClient = {
    sendNatsMessage: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository.getAgentEndPoint.mockResolvedValue({ agentEndPoint: 'http://agent:4001', id: 'agent-id' });
    service = new Oid4vpVerificationService({} as never, natsClient as never, repository as never);
  });

  it('returns a failed result for an errored session without calling the response endpoint', async () => {
    natsClient.sendNatsMessage.mockResolvedValueOnce({
      id: 'session-id',
      state: 'Error',
      errorMessage: 'Status is not valid'
    });

    const result = await service.getVerificationSessionResponse('org-id', 'session-id');

    expect(result).toMatchObject({
      responseStatus: 'Error',
      verificationStatus: 'failed',
      verified: false,
      error: 'Status is not valid'
    });
    expect(natsClient.sendNatsMessage).toHaveBeenCalledTimes(1);
  });

  it('returns verified response details for a verified session', async () => {
    natsClient.sendNatsMessage
      .mockResolvedValueOnce({ id: 'session-id', state: 'ResponseVerified' })
      .mockResolvedValueOnce({
        verificationSessionId: 'session-id',
        responseStatus: 'ResponseVerified',
        presentations: [{ encoded: 'presentation' }]
      });

    const result = await service.getVerificationSessionResponse('org-id', 'session-id');

    expect(result).toMatchObject({
      verificationSessionId: 'session-id',
      responseStatus: 'ResponseVerified',
      verificationStatus: 'verified',
      verified: true,
      error: null
    });
    expect(result).toMatchObject({ presentations: [{ encoded: 'presentation' }] });
  });

  it('returns a failed result instead of re-verifying an errored session', async () => {
    natsClient.sendNatsMessage.mockResolvedValueOnce({
      id: 'session-id',
      state: 'Error',
      errorMessage: 'Status is not valid'
    });

    const result = await service.verifyAuthorizationResponse(
      { verificationSessionId: 'session-id', authorizationResponse: {} },
      'org-id'
    );

    expect(result).toMatchObject({
      verificationStatus: 'failed',
      verified: false,
      error: 'Status is not valid'
    });
    expect(natsClient.sendNatsMessage).toHaveBeenCalledTimes(1);
  });

  it('maps the nested verification session state after a DC API verification', async () => {
    natsClient.sendNatsMessage
      .mockResolvedValueOnce({ id: 'session-id', state: 'RequestUriRetrieved' })
      .mockResolvedValueOnce({
        verificationSession: { state: 'ResponseVerified' },
        presentationExchange: { definition: {} },
        revocation: { revoked: false, verified: true }
      });

    const result = await service.verifyAuthorizationResponse(
      { verificationSessionId: 'session-id', authorizationResponse: {} },
      'org-id'
    );

    expect(result).toMatchObject({
      responseStatus: 'ResponseVerified',
      verificationStatus: 'verified',
      verified: true,
      error: null
    });
    expect(result).toMatchObject({ revocation: { revoked: false, verified: true } });
  });

  it('returns the stored error when DC API verification fails and the session moves to Error', async () => {
    natsClient.sendNatsMessage
      .mockResolvedValueOnce({ id: 'session-id', state: 'RequestCreated' })
      .mockRejectedValueOnce(new Error('Presentation verification failed'))
      .mockResolvedValueOnce({
        id: 'session-id',
        state: 'Error',
        errorMessage: 'Status is not valid'
      });

    const result = await service.verifyAuthorizationResponse(
      { verificationSessionId: 'session-id', authorizationResponse: {} },
      'org-id'
    );

    expect(result).toMatchObject({
      responseStatus: 'Error',
      verificationStatus: 'failed',
      verified: false,
      error: 'Status is not valid'
    });
    expect(natsClient.sendNatsMessage).toHaveBeenCalledTimes(3);
  });
});
