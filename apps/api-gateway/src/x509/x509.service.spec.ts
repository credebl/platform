import { BadRequestException } from '@nestjs/common';

import { X509Service } from './x509.service';

const PLAINTEXT_KEY = '-----BEGIN PRIVATE KEY-----\nMIGH\n-----END PRIVATE KEY-----';
const ENVELOPE = { sessionId: 'session-1', jwe: 'a.b.c.d.e' };

describe('X509Service certificate import key gate', () => {
  const natsClient = { sendNatsMessage: jest.fn().mockResolvedValue({}) };
  const service = new X509Service({} as never, natsClient as never);
  const original = process.env.ALLOW_PLAINTEXT_KEY_IMPORT;

  beforeEach(() => {
    natsClient.sendNatsMessage.mockClear();
    delete process.env.ALLOW_PLAINTEXT_KEY_IMPORT;
  });

  afterAll(() => {
    if (undefined === original) {
      delete process.env.ALLOW_PLAINTEXT_KEY_IMPORT;
    } else {
      process.env.ALLOW_PLAINTEXT_KEY_IMPORT = original;
    }
  });

  it('rejects a plaintext private key before it reaches NATS', async () => {
    await expect(
      service.importX509('org-1', { certificate: 'cert', privateKey: PLAINTEXT_KEY } as never, {} as never)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(natsClient.sendNatsMessage).not.toHaveBeenCalled();
  });

  it('rejects a plaintext private key even when an envelope is also sent', async () => {
    await expect(
      service.importX509(
        'org-1',
        { certificate: 'cert', privateKey: PLAINTEXT_KEY, encryptedKey: ENVELOPE } as never,
        {} as never
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(natsClient.sendNatsMessage).not.toHaveBeenCalled();
  });

  it('requires the encryptedKey envelope', async () => {
    await expect(service.importX509('org-1', { certificate: 'cert' } as never, {} as never)).rejects.toThrow(
      /encryptedKey is required/
    );
    expect(natsClient.sendNatsMessage).not.toHaveBeenCalled();
  });

  it('passes the encryptedKey envelope through to NATS untouched', async () => {
    await service.importX509('org-1', { certificate: 'cert', encryptedKey: ENVELOPE } as never, {} as never);

    expect(natsClient.sendNatsMessage).toHaveBeenCalledWith(
      expect.anything(),
      'import-x509-certificate',
      expect.objectContaining({
        orgId: 'org-1',
        options: expect.objectContaining({ certificate: 'cert', encryptedKey: ENVELOPE })
      })
    );
  });

  it('allows a plaintext key only when the migration escape hatch is enabled', async () => {
    process.env.ALLOW_PLAINTEXT_KEY_IMPORT = 'true';

    await service.importX509('org-1', { certificate: 'cert', privateKey: PLAINTEXT_KEY } as never, {} as never);

    expect(natsClient.sendNatsMessage).toHaveBeenCalled();
  });
});
