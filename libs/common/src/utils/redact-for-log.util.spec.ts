import { REDACTED, redactForLog, stringifyForLog } from './redact-for-log.util';

describe('redactForLog', () => {
  it('drops key material and request bodies at any depth', () => {
    const error = {
      response: {
        statusCode: 400,
        error: {
          privateKey: 'pem',
          privatekey: 'abcd',
          nested: [{ privateKeyJwk: { d: 'secret' }, passphrase: 'hunter2', encryptedKey: { jwe: 'a.b.c.d.e' } }]
        }
      },
      config: { url: 'http://agent.test/dids/write', data: '{"seed":"s"}', headers: { Authorization: 'token' } }
    };

    const log = stringifyForLog(error);

    for (const secret of ['pem', 'abcd', 'secret', 'hunter2', 'a.b.c.d.e', '"s"', 'token']) {
      expect(log).not.toContain(secret);
    }
    expect(log).toContain('http://agent.test/dids/write');
    expect(log).toContain(REDACTED);
  });

  it('matches sensitive keys regardless of case', () => {
    expect(redactForLog({ PrivateKey: 'x', AUTHORIZATION: 'y', ApiKey: 'z' })).toEqual({
      PrivateKey: REDACTED,
      AUTHORIZATION: REDACTED,
      ApiKey: REDACTED
    });
  });

  it('removes PEM private keys and bearer tokens from strings', () => {
    const message =
      'bad key -----BEGIN EC PRIVATE KEY-----\nMHcCAQEE\n-----END EC PRIVATE KEY----- sent with Bearer eyJhbGciOi.payload.sig';

    const log = stringifyForLog(new Error(message));

    expect(log).not.toContain('MHcCAQEE');
    expect(log).not.toContain('eyJhbGciOi');
    expect(log).toContain('bad key');
  });

  it('uses the trimmed toJSON of Axios errors and never includes the raw request', () => {
    const axiosError = Object.assign(new Error('Request failed with status code 500'), {
      request: { _header: 'POST /dids/write\r\nauthorization: secret-token\r\n' },
      toJSON: () => ({
        message: 'Request failed with status code 500',
        status: 500,
        config: { url: 'http://agent.test', headers: { authorization: 'secret-token' }, data: '{}' }
      })
    });

    const log = stringifyForLog(axiosError);

    expect(log).not.toContain('secret-token');
    expect(log).toContain('Request failed with status code 500');
  });

  it('handles circular references and non-objects', () => {
    const circular: Record<string, unknown> = { name: 'loop' };
    circular.self = circular;

    expect(redactForLog(circular)).toEqual({ name: 'loop', self: '[Circular]' });
    expect(redactForLog(undefined)).toBeUndefined();
    expect(stringifyForLog(42)).toBe('42');
  });
});
