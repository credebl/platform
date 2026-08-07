jest.mock('../user.service', () => ({ UserService: jest.fn() }));

import { FidoService } from './fido.service';

describe('FidoService passkey device ownership', () => {
  const fidoUserRepository = {
    checkFidoUserExist: jest.fn()
  };
  const userDevicesRepository = {
    checkUserDeviceByCredentialId: jest.fn(),
    deleteUserDeviceByCredentialId: jest.fn(),
    updateUserDeviceByCredentialId: jest.fn()
  };
  const service = new FidoService(
    fidoUserRepository as never,
    userDevicesRepository as never,
    {} as never,
    {} as never,
    {} as never
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not delete a credential owned by another user', async () => {
    fidoUserRepository.checkFidoUserExist.mockResolvedValue({ id: 'actor-id' });
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'other-user-id',
      deletedAt: null
    });

    await expect(
      service.deleteFidoUserDevice({ credentialId: 'credential-id', actorEmail: 'actor@example.com' })
    ).rejects.toBeDefined();
    expect(userDevicesRepository.deleteUserDeviceByCredentialId).not.toHaveBeenCalled();
  });

  it('deletes a credential owned by the authenticated user', async () => {
    fidoUserRepository.checkFidoUserExist.mockResolvedValue({ id: 'actor-id' });
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'actor-id',
      deletedAt: null
    });
    userDevicesRepository.deleteUserDeviceByCredentialId.mockResolvedValue({ count: 1 });

    await expect(
      service.deleteFidoUserDevice({ credentialId: 'credential-id', actorEmail: 'actor@example.com' })
    ).resolves.toBe('Device deleted successfully');
  });
});
