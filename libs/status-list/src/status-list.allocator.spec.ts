import { StatusListAllocatorService } from './status-list.allocator';

describe('StatusListAllocatorService revocation state', () => {
  it('marks only unrevoked allocations for the issuance session', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 2 });
    const service = new StatusListAllocatorService({
      ['issued_oid4vc_credentials']: { updateMany }
    } as never);

    await expect(service.markCredentialAllocationsRevoked('org-1', 'session-1')).resolves.toBe(2);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        orgId: 'org-1',
        issuanceSessionId: 'session-1',
        revokedAt: null
      },
      data: {
        revokedAt: expect.any(Date)
      }
    });
  });
});
