import { Oid4vcIssuanceService } from './oid4vc-issuance.service';

describe('Oid4vcIssuanceService revokeCredential', () => {
  let repository: { getAgentEndPoint: jest.Mock };
  let allocator: {
    getCredentialAllocations: jest.Mock;
    markCredentialAllocationsRevoked: jest.Mock;
  };
  let service: Oid4vcIssuanceService;
  const setNatsCall = (natsCall: jest.Mock): void => {
    (service as unknown as { natsCall: jest.Mock }).natsCall = natsCall;
  };

  beforeEach(() => {
    repository = {
      getAgentEndPoint: jest.fn().mockResolvedValue({
        agentEndPoint: 'http://agent.example.org'
      })
    };
    allocator = {
      getCredentialAllocations: jest.fn(),
      markCredentialAllocationsRevoked: jest.fn().mockResolvedValue(1)
    };
    service = new Oid4vcIssuanceService({} as never, repository as never, allocator as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks the session allocations revoked after the agent revokes the status list', async () => {
    allocator.getCredentialAllocations.mockResolvedValue([{ listId: 'list-1', index: 7 }]);
    const natsCall = jest.fn().mockResolvedValue({ response: { message: 'revoked' } });
    setNatsCall(natsCall);

    const result = await service.revokeCredential('session-1', 'org-1');

    expect(natsCall).toHaveBeenCalledWith(
      { cmd: 'agent-service-oid4vc-revoke-credential' },
      expect.objectContaining({ orgId: 'org-1' })
    );
    expect(allocator.markCredentialAllocationsRevoked).toHaveBeenCalledWith('org-1', 'session-1');
    expect(result).toEqual({ response: { message: 'revoked' } });
  });

  it('does not mark allocations when no status list allocation exists', async () => {
    allocator.getCredentialAllocations.mockResolvedValue([]);

    await expect(service.revokeCredential('session-1', 'org-1')).rejects.toBeDefined();

    expect(allocator.markCredentialAllocationsRevoked).not.toHaveBeenCalled();
  });

  it('does not mark allocations when the agent revoke call fails', async () => {
    allocator.getCredentialAllocations.mockResolvedValue([{ listId: 'list-1', index: 7 }]);
    setNatsCall(jest.fn().mockRejectedValue(new Error('agent unavailable')));

    await expect(service.revokeCredential('session-1', 'org-1')).rejects.toBeDefined();

    expect(allocator.markCredentialAllocationsRevoked).not.toHaveBeenCalled();
  });
});
