import { BadRequestException } from '@nestjs/common';

import { AgentService } from './agent-service.service';

const PLAINTEXT_KEY = '-----BEGIN PRIVATE KEY-----\nMIGH\n-----END PRIVATE KEY-----';

describe('AgentService key import gate', () => {
  const natsClient = { sendNatsMessage: jest.fn().mockResolvedValue({}) };
  const service = new AgentService({} as never, natsClient as never);
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
      service.createDid({ method: 'key', privateKey: PLAINTEXT_KEY } as never, 'org-1', {} as never)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(natsClient.sendNatsMessage).not.toHaveBeenCalled();
  });

  it('rejects a plaintext did:polygon key before it reaches NATS', async () => {
    await expect(
      service.createDid(
        { method: 'polygon', network: 'polygon:testnet', privatekey: 'ab'.repeat(32) } as never,
        'org-1',
        {} as never
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(natsClient.sendNatsMessage).not.toHaveBeenCalled();
  });

  it('rejects a private JWK and a passphrase before they reach NATS', async () => {
    await expect(
      service.importDidX509(
        { certificateChain: ['cert'], privateKeyJwk: { kty: 'EC' }, passphrase: 'secret' } as never,
        'org-1',
        {} as never
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(natsClient.sendNatsMessage).not.toHaveBeenCalled();
  });

  it('forwards an encrypted envelope', async () => {
    await service.createDid(
      { method: 'key', encryptedKey: { sessionId: 'session-1', jwe: 'a.b.c.d.e' } } as never,
      'org-1',
      {} as never
    );

    expect(natsClient.sendNatsMessage).toHaveBeenCalledWith(
      expect.anything(),
      'create-did',
      expect.objectContaining({
        createDidDto: expect.objectContaining({ encryptedKey: { sessionId: 'session-1', jwe: 'a.b.c.d.e' } })
      })
    );
  });

  it('allows plaintext only when the migration escape hatch is enabled', async () => {
    process.env.ALLOW_PLAINTEXT_KEY_IMPORT = 'true';

    await service.createDid({ method: 'key', privateKey: PLAINTEXT_KEY } as never, 'org-1', {} as never);

    expect(natsClient.sendNatsMessage).toHaveBeenCalled();
  });
});
