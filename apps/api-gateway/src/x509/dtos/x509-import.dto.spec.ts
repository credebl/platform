import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { X509ImportCertificateOptionsDto } from './x509.dto';

async function errorsOf(plain: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(X509ImportCertificateOptionsDto, { certificate: 'MIIB', ...plain }));
  return errors.map((error) => error.property);
}

describe('X509ImportCertificateOptionsDto certificateChain', () => {
  it('is optional', async () => {
    expect(await errorsOf({})).toEqual([]);
  });

  it('accepts a list of certificates', async () => {
    expect(await errorsOf({ certificateChain: ['MIIC', 'MIID'] })).toEqual([]);
  });

  it('rejects a value that is not a list of strings', async () => {
    expect(await errorsOf({ certificateChain: 'MIIC' })).toEqual(['certificateChain']);
    expect(await errorsOf({ certificateChain: [1, 2] })).toEqual(['certificateChain']);
  });

  it('rejects a chain that is too long and a certificate that is too big', async () => {
    const tooMany = Array.from({ length: 11 }, () => 'MIIC');
    expect(await errorsOf({ certificateChain: tooMany })).toEqual(['certificateChain']);
    expect(await errorsOf({ certificateChain: ['A'.repeat(20001)] })).toEqual(['certificateChain']);
  });
});
