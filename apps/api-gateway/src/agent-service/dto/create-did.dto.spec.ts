import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateDidImportSessionDto } from './create-did.dto';

describe('CreateDidImportSessionDto', () => {
  const check = async (method: unknown): Promise<number> => {
    const errors = await validate(plainToInstance(CreateDidImportSessionDto, { method }));
    return errors.length;
  };

  it.each(['key', 'web', 'x509', 'polygon', 'x509-certificate'])('accepts %s', async (method) => {
    expect(await check(method)).toBe(0);
  });

  it.each(['indy', 'x509-cert', '', undefined])('rejects %p', async (method) => {
    expect(await check(method)).toBeGreaterThan(0);
  });
});
