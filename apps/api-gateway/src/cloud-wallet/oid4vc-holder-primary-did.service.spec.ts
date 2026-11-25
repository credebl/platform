/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CloudWalletService } from './cloud-wallet.service';

describe('CloudWalletService holder primary DID suggestion', () => {
  const orgId = '6f0a1f2e-1a11-4b3a-9e18-3d71aef0b001';
  const userId = '6f0a1f2e-1a11-4b3a-9e18-3d71aef0b002';
  const holderTenantId = 'holder-tenant-1';
  const didUrl = 'did:web:holder.example.com#key-1';

  let service: CloudWalletService;
  let natsClient: { sendNatsMessage: jest.Mock };

  const didList = [{ did: 'did:web:holder.example.com', didDocument: { verificationMethod: [{ id: didUrl }] } }];

  beforeEach(() => {
    natsClient = { sendNatsMessage: jest.fn() };
    service = new CloudWalletService({} as never, natsClient as never, {} as never);
    jest.spyOn(service, 'findHolderWallet').mockResolvedValue({ userId, tenantId: holderTenantId });
    jest.spyOn(service, 'getHolderPrimaryDid').mockResolvedValue(null);
    jest.spyOn(service, 'getDidList').mockResolvedValue(didList as never);
    jest.spyOn(service, 'setHolderPrimaryDid').mockImplementation(async (preference) => preference);
    jest.spyOn(service, 'deleteHolderPrimaryDid').mockResolvedValue(true);
  });

  it('saves a preference when the DID exists in the holder tenant (P-UI-02)', async () => {
    const saved = await service.setHolderPrimaryDidForUser(orgId, userId, 'holder@example.test', didUrl, holderTenantId);

    expect(service.getDidList).toHaveBeenCalledWith({ userId, email: 'holder@example.test' });
    expect(service.setHolderPrimaryDid).toHaveBeenCalledWith({ orgId, userId, holderTenantId, didUrl });
    expect(saved.didUrl).toBe(didUrl);
  });

  it('rejects a DID that is not in the holder tenant (N-V-16)', async () => {
    jest.spyOn(service, 'getDidList').mockResolvedValue([{ did: 'did:key:other' }] as never);

    await expect(
      service.setHolderPrimaryDidForUser(orgId, userId, 'holder@example.test', didUrl, holderTenantId)
    ).rejects.toThrow(
      new BadRequestException(ResponseMessages.holderPrimaryDid.error.notFound)
    );
    expect(service.setHolderPrimaryDid).not.toHaveBeenCalled();
  });

  it('rejects a DID URL fragment that is not a verification method of the holder DID', async () => {
    jest
      .spyOn(service, 'getDidList')
      .mockResolvedValue([{ did: 'did:web:holder.example.com', didDocument: { verificationMethod: [{ id: 'did:web:holder.example.com#other' }] } }] as never);

    await expect(
      service.setHolderPrimaryDidForUser(orgId, userId, 'holder@example.test', didUrl, holderTenantId)
    ).rejects.toThrow('PRIMARY_DID_NOT_FOUND');
  });

  it('rejects a user without access to the holder tenant (N-V-17)', async () => {
    jest.spyOn(service, 'findHolderWallet').mockResolvedValue(null);

    await expect(
      service.setHolderPrimaryDidForUser(orgId, userId, 'holder@example.test', didUrl, holderTenantId)
    ).rejects.toThrow(new ForbiddenException(ResponseMessages.holderPrimaryDid.error.accessDenied));
    expect(service.getDidList).not.toHaveBeenCalled();
    expect(service.setHolderPrimaryDid).not.toHaveBeenCalled();
  });

  it('rejects a mismatched holder tenant (N-V-17)', async () => {
    jest.spyOn(service, 'findHolderWallet').mockResolvedValue({ userId, tenantId: 'another-tenant' });

    await expect(
      service.setHolderPrimaryDidForUser(orgId, userId, 'holder@example.test', didUrl, holderTenantId)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps an agent DID-list failure to PRIMARY_DID_NOT_FOUND without saving', async () => {
    jest.spyOn(service, 'getDidList').mockRejectedValue(new Error('agent unavailable'));

    await expect(
      service.setHolderPrimaryDidForUser(orgId, userId, 'holder@example.test', didUrl, holderTenantId)
    ).rejects.toThrow('PRIMARY_DID_NOT_FOUND');
    expect(service.setHolderPrimaryDid).not.toHaveBeenCalled();
  });

  it('returns the preference scoped to the user wallet tenant (P-UI-01)', async () => {
    const preference = { orgId, userId, holderTenantId, didUrl };
    jest.spyOn(service, 'getHolderPrimaryDid').mockResolvedValue(preference);

    await expect(service.getHolderPrimaryDidForUser(orgId, userId)).resolves.toBe(preference);
    expect(service.findHolderWallet).toHaveBeenCalledWith({ userId });
    expect(service.getHolderPrimaryDid).toHaveBeenCalledWith({ orgId, userId, holderTenantId });
  });

  it('returns null when the user has no holder wallet', async () => {
    jest.spyOn(service, 'findHolderWallet').mockResolvedValue(null);

    await expect(service.getHolderPrimaryDidForUser(orgId, userId)).resolves.toBeNull();
    expect(service.getHolderPrimaryDid).not.toHaveBeenCalled();
  });

  it('deletes the preference scoped to the user wallet tenant (P-UI-03)', async () => {
    await expect(service.deleteHolderPrimaryDidForUser(orgId, userId)).resolves.toBe(true);
    expect(service.deleteHolderPrimaryDid).toHaveBeenCalledWith({ orgId, userId, holderTenantId });
  });
});
