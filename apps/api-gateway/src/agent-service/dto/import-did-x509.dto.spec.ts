import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ImportDidX509Dto } from './import-did-x509.dto';

const CERT = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
const KEY = '-----BEGIN PRIVATE KEY-----\nMIGH\n-----END PRIVATE KEY-----';

async function errorsFor(body: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(ImportDidX509Dto, body));
  function flatten(list: typeof errors): string[] {
    return list.flatMap((error) => [...Object.values(error.constraints ?? {}), ...flatten(error.children ?? [])]);
  }
  return flatten(errors);
}

describe('ImportDidX509Dto', () => {
  it('accepts a chain and key, with isPrimaryDid defaulting to false', async () => {
    const dto = plainToInstance(ImportDidX509Dto, { certificateChain: [CERT, CERT], privateKey: KEY });

    expect(await validate(dto)).toEqual([]);
    expect(dto.isPrimaryDid).toBe(false);
  });

  it('accepts subject, san, eku and fulcio-issuer policies', async () => {
    expect(
      await errorsFor({
        certificateChain: [CERT],
        privateKey: KEY,
        policies: [
          { type: 'subject', fields: { CN: 'example.com', O: 'Example Org' } },
          { type: 'san', sanType: 'dns', value: 'example.com' },
          { type: 'eku', value: '1.3.6.1.5.5.7.3.1' },
          { type: 'fulcio-issuer', value: 'accounts.example.com' }
        ]
      })
    ).toEqual([]);
  });

  it('rejects an empty chain and a missing private key', async () => {
    const errors = await errorsFor({ certificateChain: [] });

    expect(errors).toContain('certificateChain must contain at least one certificate');
    expect(errors).toContain('privateKey is required');
  });

  it('rejects an empty chain entry', async () => {
    expect(await errorsFor({ certificateChain: [CERT, ''], privateKey: KEY })).toContain(
      'certificateChain entries must not be empty'
    );
  });

  it('rejects unknown policy types and incomplete policies', async () => {
    const errors = await errorsFor({
      certificateChain: [CERT],
      privateKey: KEY,
      policies: [
        { type: 'issuer' },
        { type: 'subject' },
        { type: 'san', sanType: 'ip', value: '10.0.0.1' },
        { type: 'eku' }
      ]
    });

    expect(errors).toContain('type must be one of subject, san, eku, fulcio-issuer');
    expect(errors).toContain('fields is required for the subject policy');
    expect(errors).toContain('sanType must be one of dns, email, uri');
    expect(errors).toContain('value is required for the san, eku and fulcio-issuer policies');
  });
});
