/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CloudWalletController } from './cloud-wallet.controller';
import { CreateCloudWalletDidImportSessionDto } from './dtos/cloudWallet.dto';

const ENVELOPE = { sessionId: 'session-1', jwe: 'a.b.c.d.e' };
const POLYGON = { method: 'polygon', keyType: 'ed25519', network: 'polygon:testnet' };

describe('CloudWalletController DID key import', () => {
  const cloudWalletService = {
    createDid: jest.fn().mockResolvedValue({ did: 'did:polygon:0x1' }),
    createDidImportSession: jest.fn().mockResolvedValue({ sessionId: 'session-1' })
  };
  const controller = new CloudWalletController(cloudWalletService as any);
  const user = { id: 'user-1', email: 'holder@example.test' } as any;
  const original = process.env.ALLOW_PLAINTEXT_KEY_IMPORT;
  const res = (): any => {
    const response: any = {};
    response.setHeader = jest.fn();
    response.status = jest.fn().mockReturnValue(response);
    response.json = jest.fn().mockReturnValue(response);
    return response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ALLOW_PLAINTEXT_KEY_IMPORT;
  });

  afterAll(() => {
    if (undefined === original) {
      delete process.env.ALLOW_PLAINTEXT_KEY_IMPORT;
    } else {
      process.env.ALLOW_PLAINTEXT_KEY_IMPORT = original;
    }
  });

  it('rejects a plaintext privatekey before it reaches NATS', async () => {
    await expect(
      controller.createDid({ ...POLYGON, privatekey: 'ab'.repeat(32) } as any, user, res())
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudWalletService.createDid).not.toHaveBeenCalled();
  });

  it('requires encryptedKey for polygon', async () => {
    await expect(controller.createDid(POLYGON as any, user, res())).rejects.toBeInstanceOf(BadRequestException);
    expect(cloudWalletService.createDid).not.toHaveBeenCalled();
  });

  it('accepts an encryptedKey envelope and passes it through', async () => {
    await controller.createDid({ ...POLYGON, encryptedKey: ENVELOPE } as any, user, res());

    expect(cloudWalletService.createDid).toHaveBeenCalledWith(
      expect.objectContaining({ encryptedKey: ENVELOPE, userId: 'user-1' })
    );
  });

  it('creates an import session for the authenticated holder without caching', async () => {
    const response = res();

    await controller.createDidImportSession({ method: 'polygon' }, user, response);

    expect(cloudWalletService.createDidImportSession).toHaveBeenCalledWith({
      method: 'polygon',
      email: 'holder@example.test',
      userId: 'user-1'
    });
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(response.status).toHaveBeenCalledWith(201);
  });

  it('only accepts polygon for the session method', async () => {
    const check = async (method: unknown): Promise<number> => {
      const errors = await validate(plainToInstance(CreateCloudWalletDidImportSessionDto, { method }));
      return errors.length;
    };

    expect(await check('polygon')).toBe(0);
    expect(await check('key')).toBeGreaterThan(0);
    expect(await check(undefined)).toBeGreaterThan(0);
  });
});
