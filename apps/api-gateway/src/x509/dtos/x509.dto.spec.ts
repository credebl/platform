import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { X509ImportCertificateOptionsDto } from './x509.dto';

describe('X509ImportCertificateOptionsDto', () => {
  it('accepts an encryptedKey envelope and keeps it', async () => {
    const dto = plainToInstance(X509ImportCertificateOptionsDto, {
      certificate: 'cert',
      encryptedKey: { sessionId: 's', jwe: 'a.b.c.d.e' }
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.encryptedKey).toEqual({ sessionId: 's', jwe: 'a.b.c.d.e' });
  });

  it('rejects a malformed envelope', async () => {
    const dto = plainToInstance(X509ImportCertificateOptionsDto, {
      certificate: 'cert',
      encryptedKey: { sessionId: 's' }
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects an oversized privateKey so it cannot be used to flood the gateway', async () => {
    const dto = plainToInstance(X509ImportCertificateOptionsDto, {
      certificate: 'cert',
      privateKey: 'a'.repeat(20_001)
    });

    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
