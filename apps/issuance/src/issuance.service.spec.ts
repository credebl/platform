/* eslint-disable @typescript-eslint/no-explicit-any */
import { IssuanceService } from './issuance.service';

describe('IssuanceService bitstring status list injection', () => {
  const originalStatusListHost = process.env.STATUS_LIST_HOST;
  let repository: {
    getAgentEndPoint: jest.Mock;
    getCredentialByThreadId: jest.Mock;
    updateCredentialStatusByThreadId: jest.Mock;
  };
  let allocator: { allocate: jest.Mock; release: jest.Mock };
  let service: IssuanceService;

  beforeEach(() => {
    process.env.STATUS_LIST_HOST = 'https://status.example.org';
    repository = {
      getAgentEndPoint: jest
        .fn()
        .mockResolvedValue({ orgDid: 'did:example:issuer', agentEndPoint: 'http://agent.example.org' }),
      getCredentialByThreadId: jest.fn(),
      updateCredentialStatusByThreadId: jest.fn().mockResolvedValue(1)
    };
    allocator = {
      allocate: jest.fn().mockResolvedValue({ listId: 'list-1', index: 7 }),
      release: jest.fn()
    };
    service = new IssuanceService(
      {} as never,
      {} as never,
      repository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      allocator as never
    );
  });

  afterEach(() => {
    process.env.STATUS_LIST_HOST = originalStatusListHost;
    jest.clearAllMocks();
  });

  it('injects a V1 BitstringStatusListEntry and appends the status context', async () => {
    const credential: Record<string, unknown> = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://example.org/schema'],
      type: ['VerifiableCredential'],
      credentialSubject: { id: 'did:example:holder' }
    };

    const allocation = await (service as any).attachBitstringStatusList('org-1', credential, 'v1.0');

    expect(allocator.allocate).toHaveBeenCalledWith('org-1', 'did:example:issuer');
    expect(allocation).toEqual({
      listId: 'list-1',
      index: 7,
      statusListUri: 'https://status.example.org/status-lists/list-1',
      credentialVersion: 'v1.0'
    });
    expect(credential['@context']).toEqual([
      'https://www.w3.org/2018/credentials/v1',
      'https://example.org/schema',
      'https://www.w3.org/ns/credentials/status/v1'
    ]);
    expect(credential.credentialStatus).toEqual({
      id: 'https://status.example.org/status-lists/list-1#7',
      type: 'BitstringStatusListEntry',
      statusPurpose: 'revocation',
      statusListIndex: '7',
      statusListCredential: 'https://status.example.org/status-lists/list-1'
    });
  });

  it('injects a V2 entry without the V1 context or issuanceDate', async () => {
    const credential: Record<string, unknown> = {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://example.org/schema'],
      type: ['VerifiableCredential'],
      issuanceDate: '2024-01-01T00:00:00.000Z',
      credentialSubject: { id: 'did:example:holder' }
    };

    await (service as any).attachBitstringStatusList('org-1', credential, 'v2.0');

    expect(credential['@context']).toEqual(['https://www.w3.org/ns/credentials/v2', 'https://example.org/schema']);
    expect(credential.issuanceDate).toBeUndefined();
    expect(credential.validFrom).toEqual(expect.any(String));
    expect((credential.credentialStatus as Record<string, unknown>).type).toBe('BitstringStatusListEntry');
  });

  it('fails closed when STATUS_LIST_HOST is not configured', async () => {
    delete process.env.STATUS_LIST_HOST;

    await expect(
      (service as any).attachBitstringStatusList('org-1', { '@context': [], type: [] }, 'v1.0')
    ).rejects.toBeDefined();
    expect(allocator.allocate).not.toHaveBeenCalled();
  });

  it('back-fills the allocation by threadId', async () => {
    await (service as any).backfillStatusListAllocation('thread-1', {
      listId: 'list-1',
      index: 7,
      statusListUri: 'https://status.example.org/status-lists/list-1',
      credentialVersion: 'v1.0'
    });

    expect(repository.updateCredentialStatusByThreadId).toHaveBeenCalledWith('thread-1', {
      statusListId: 'list-1',
      statusListIndex: 7,
      statusListUri: 'https://status.example.org/status-lists/list-1',
      credentialVersion: 'v1.0'
    });
  });

  it('revokes a DIDComm credential and marks the record revoked', async () => {
    repository.getCredentialByThreadId.mockResolvedValue({
      orgId: 'org-1',
      threadId: 'thread-1',
      statusListId: 'list-1',
      statusListIndex: 7,
      revokedAt: null
    });
    (service as any).natsCall = jest.fn().mockResolvedValue({ response: { revoked: true } });

    const result = await service.revokeCredential('org-1', 'thread-1', {} as never);

    expect((service as any).natsCall).toHaveBeenCalledWith(
      { cmd: 'agent-service-didcomm-revoke-credential' },
      expect.objectContaining({
        orgId: 'org-1',
        listId: 'list-1',
        index: 7,
        issuerDid: 'did:example:issuer'
      })
    );
    expect(repository.updateCredentialStatusByThreadId).toHaveBeenCalledWith('thread-1', {
      revokedAt: expect.any(Date)
    });
    expect(result).toEqual({ response: { revoked: true } });
  });

  it('treats an already revoked credential as idempotent', async () => {
    repository.getCredentialByThreadId.mockResolvedValue({
      orgId: 'org-1',
      threadId: 'thread-1',
      revokedAt: new Date()
    });
    (service as any).natsCall = jest.fn();

    const result = await service.revokeCredential('org-1', 'thread-1', {} as never);

    expect(result).toEqual({ response: { revoked: true, alreadyRevoked: true } });
    expect((service as any).natsCall).not.toHaveBeenCalled();
    expect(repository.updateCredentialStatusByThreadId).not.toHaveBeenCalled();
  });

  it('rejects revocation when no status list allocation exists', async () => {
    repository.getCredentialByThreadId.mockResolvedValue({
      orgId: 'org-1',
      threadId: 'thread-1',
      statusListId: null,
      statusListIndex: null,
      revokedAt: null
    });

    await expect(service.revokeCredential('org-1', 'thread-1', {} as never)).rejects.toBeDefined();
  });

  it('does not attempt a back-fill when the threadId is missing', async () => {
    await (service as any).backfillStatusListAllocation(undefined, {
      listId: 'list-1',
      index: 7,
      statusListUri: 'https://status.example.org/status-lists/list-1',
      credentialVersion: 'v1.0'
    });

    expect(repository.updateCredentialStatusByThreadId).not.toHaveBeenCalled();
  });
});
