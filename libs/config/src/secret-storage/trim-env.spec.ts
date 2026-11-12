import { trimEnvVariables } from './trim-env';

describe('trimEnvVariables', () => {
  it('trims leading and trailing whitespace from values', () => {
    const env: NodeJS.ProcessEnv = {
      SMTP_HOST: 'smtp.example.com ',
      EMAIL_PROVIDER: '  smtp\t',
      SMTP_PORT: '587\n'
    };

    trimEnvVariables(env);

    expect(env).toEqual({ SMTP_HOST: 'smtp.example.com', EMAIL_PROVIDER: 'smtp', SMTP_PORT: '587' });
  });

  it('keeps inner whitespace, empty values and undefined values untouched', () => {
    const env: NodeJS.ProcessEnv = { A: 'a b', B: '', C: undefined };

    trimEnvVariables(env);

    expect(env).toEqual({ A: 'a b', B: '', C: undefined });
  });

  it('trims process.env by default', () => {
    process.env.TRIM_ENV_TEST = ' value ';

    trimEnvVariables();

    expect(process.env.TRIM_ENV_TEST).toBe('value');
    delete process.env.TRIM_ENV_TEST;
  });
});
