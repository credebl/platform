import { ForbiddenException } from '@nestjs/common';
import { FidoController } from './fido.controller';

const response = (): { status: jest.Mock; json: jest.Mock } => {
  const res = {
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe('FidoController passkey management authorization', () => {
  const fidoService = {
    fetchFidoUserDetails: jest.fn(),
    updateFidoUserDeviceName: jest.fn(),
    deleteFidoUserDevice: jest.fn()
  };
  const controller = new FidoController(fidoService as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects access to another user passkey details', async () => {
    await expect(
      controller.fetchFidoUserDetails(
        { user: { email: 'owner@example.com' } },
        'other@example.com',
        response() as never
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fidoService.fetchFidoUserDetails).not.toHaveBeenCalled();
  });

  it('passes the authenticated identity to device updates', async () => {
    fidoService.updateFidoUserDeviceName.mockResolvedValue({ response: 'updated' });
    await controller.updateFidoUserDeviceName(
      { user: { email: 'Owner@Example.com' } },
      'credential-id',
      'phone',
      response() as never
    );
    expect(fidoService.updateFidoUserDeviceName).toHaveBeenCalledWith('credential-id', 'phone', 'owner@example.com');
  });

  it('passes the authenticated identity to device deletion', async () => {
    fidoService.deleteFidoUserDevice.mockResolvedValue({ response: 'deleted' });
    await controller.deleteFidoUserDevice(
      { user: { email: 'owner@example.com' } },
      'credential-id',
      response() as never
    );
    expect(fidoService.deleteFidoUserDevice).toHaveBeenCalledWith('credential-id', 'owner@example.com');
  });
});
