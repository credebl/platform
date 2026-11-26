/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { CloudWalletController } from './cloud-wallet.controller';

describe('CloudWalletController primary DID suggestion routes', () => {
  const orgId = 'org-1';
  const userId = 'user-1';
  const user = { id: userId, email: 'holder@example.test' } as never;
  const preference = {
    orgId,
    userId,
    holderTenantId: 'tenant-1',
    didUrl: 'did:web:holder.example.com#key-1'
  };

  let service: Record<string, jest.Mock>;
  let controller: CloudWalletController;
  let res: any;

  beforeEach(() => {
    service = {
      getHolderPrimaryDidForUser: jest.fn().mockResolvedValue(preference),
      setHolderPrimaryDidForUser: jest.fn().mockResolvedValue(preference),
      deleteHolderPrimaryDidForUser: jest.fn().mockResolvedValue(true),
      requestCredential: jest.fn()
    };
    controller = new CloudWalletController(service as never);
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  it('returns the saved suggestion (P-UI-01)', async () => {
    await controller.getHolderPrimaryDid(orgId, userId, user, res);

    expect(service.getHolderPrimaryDidForUser).toHaveBeenCalledWith(orgId, userId);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: preference }));
  });

  it('returns 204 when no suggestion exists', async () => {
    service.getHolderPrimaryDidForUser.mockResolvedValue(null);

    await controller.getHolderPrimaryDid(orgId, userId, user, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    expect(res.send).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('saves the suggestion with the authenticated user email (P-UI-02)', async () => {
    await controller.setHolderPrimaryDid(
      orgId,
      userId,
      { didUrl: preference.didUrl, holderTenantId: preference.holderTenantId },
      user,
      res
    );

    expect(service.setHolderPrimaryDidForUser).toHaveBeenCalledWith(
      orgId,
      userId,
      'holder@example.test',
      preference.didUrl,
      preference.holderTenantId
    );
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
  });

  it('refuses to read or change another user\'s suggestion (N-V-17)', async () => {
    const otherUser = { id: 'user-2', email: 'other@example.test' } as never;

    await expect(controller.getHolderPrimaryDid(orgId, userId, otherUser, res)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    await expect(
      controller.setHolderPrimaryDid(
        orgId,
        userId,
        { didUrl: preference.didUrl, holderTenantId: preference.holderTenantId },
        otherUser,
        res
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.deleteHolderPrimaryDid(orgId, userId, otherUser, res)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(service.getHolderPrimaryDidForUser).not.toHaveBeenCalled();
    expect(service.setHolderPrimaryDidForUser).not.toHaveBeenCalled();
    expect(service.deleteHolderPrimaryDidForUser).not.toHaveBeenCalled();
  });

  it('clears the suggestion (P-UI-03)', async () => {
    await controller.deleteHolderPrimaryDid(orgId, userId, user, res);

    expect(service.deleteHolderPrimaryDidForUser).toHaveBeenCalledWith(orgId, userId);
    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
  });
});
