jest.mock('../user.service', () => ({ UserService: jest.fn() }));

import { ForbiddenException } from '@nestjs/common';
import { FidoService } from './fido.service';

describe('FidoService passkey device ownership', () => {
  const fidoUserRepository = {
    checkFidoUserExist: jest.fn(),
    getUserDetails: jest.fn()
  };
  const userDevicesRepository = {
    checkUserDeviceByCredentialId: jest.fn(),
    deleteUserDeviceByCredentialId: jest.fn(),
    updateUserDeviceByCredentialId: jest.fn(),
    updateDeviceByCredentialId: jest.fn(),
    addCredentialIdAndNameById: jest.fn()
  };
  const service = new FidoService(
    fidoUserRepository as never,
    userDevicesRepository as never,
    {} as never,
    {} as never,
    {} as never
  );

  beforeEach(() => jest.clearAllMocks());

  const mockAuthenticatedActor = (): void => {
    async function resolveActor(email: string): Promise<{ id: string } | undefined> {
      return 'actor@example.com' === email ? { id: 'actor-id' } : undefined;
    }
    fidoUserRepository.getUserDetails.mockImplementation(resolveActor);
  };

  it('does not delete a credential owned by another user', async () => {
    mockAuthenticatedActor();
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'other-user-id',
      deletedAt: null
    });

    await expect(
      service.deleteFidoUserDevice({ credentialId: 'Y3JlZGVudGlhbC1pZA', actorEmail: 'actor@example.com' })
    ).rejects.toEqual(expect.objectContaining({ error: expect.any(ForbiddenException) }));
    expect(userDevicesRepository.deleteUserDeviceByCredentialId).not.toHaveBeenCalled();
  });

  it('deletes a credential owned by the authenticated user', async () => {
    mockAuthenticatedActor();
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'actor-id',
      deletedAt: null
    });
    userDevicesRepository.deleteUserDeviceByCredentialId.mockResolvedValue({ count: 1 });

    await expect(
      service.deleteFidoUserDevice({ credentialId: 'Y3JlZGVudGlhbC1pZA', actorEmail: 'actor@example.com' })
    ).resolves.toBe('Device deleted successfully');
    expect(userDevicesRepository.deleteUserDeviceByCredentialId).toHaveBeenCalledWith('Y3JlZGVudGlhbC1pZA');
  });

  it('does not update a credential owned by another user', async () => {
    mockAuthenticatedActor();
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'other-user-id',
      deletedAt: null
    });

    await expect(
      service.updateUser({ credentialId: 'Y3JlZGVudGlhbC1pZA', actorEmail: 'actor@example.com' } as never)
    ).rejects.toEqual(expect.objectContaining({ error: expect.any(ForbiddenException) }));
    expect(userDevicesRepository.updateDeviceByCredentialId).not.toHaveBeenCalled();
  });

  it('does not rename a credential owned by another user', async () => {
    mockAuthenticatedActor();
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'other-user-id',
      deletedAt: null
    });

    await expect(
      service.updateFidoUserDeviceName({
        credentialId: 'Y3JlZGVudGlhbC1pZA',
        deviceName: 'new name',
        actorEmail: 'actor@example.com'
      })
    ).rejects.toEqual(expect.objectContaining({ error: expect.any(ForbiddenException) }));
    expect(userDevicesRepository.updateUserDeviceByCredentialId).not.toHaveBeenCalled();
  });

  it('rejects a missing device without deleting it', async () => {
    mockAuthenticatedActor();
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue(null);

    await expect(
      service.deleteFidoUserDevice({ credentialId: 'Y3JlZGVudGlhbC1pZA', actorEmail: 'actor@example.com' })
    ).rejects.toEqual(expect.objectContaining({ error: expect.any(ForbiddenException) }));
    expect(userDevicesRepository.deleteUserDeviceByCredentialId).not.toHaveBeenCalled();
  });

  it('rejects a deleted device without renaming it', async () => {
    mockAuthenticatedActor();
    userDevicesRepository.checkUserDeviceByCredentialId.mockResolvedValue({
      id: 'device-id',
      userId: 'actor-id',
      deletedAt: new Date()
    });

    await expect(
      service.updateFidoUserDeviceName({
        credentialId: 'Y3JlZGVudGlhbC1pZA',
        deviceName: 'new name',
        actorEmail: 'actor@example.com'
      })
    ).rejects.toEqual(expect.objectContaining({ error: expect.any(ForbiddenException) }));
    expect(userDevicesRepository.updateUserDeviceByCredentialId).not.toHaveBeenCalled();
  });
});
