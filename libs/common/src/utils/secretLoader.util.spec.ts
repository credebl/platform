import { CommonConstants } from '../common.constant';

jest.mock('libs/config/src/secret-storage/secrets-loader', () => ({
  getSecretProvider: jest.fn()
}));

describe('fetchSecrets', () => {
  const originalEnv = { ...process.env };

  let fetchSecrets: (secretKey: string) => Promise<Record<string, string>>;
  let mockedGetSecretProvider: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.ENABLE_BAO;
    delete process.env.SECRETS_PROVIDER;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ fetchSecrets } = require('./secretLoader.util'));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mockedGetSecretProvider = require('libs/config/src/secret-storage/secrets-loader').getSecretProvider;

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns an empty object when OpenBao is disabled', async () => {
    process.env.ENABLE_BAO = 'false';

    await expect(fetchSecrets(CommonConstants.SMTP_CONFIG)).resolves.toEqual({});
    expect(mockedGetSecretProvider).not.toHaveBeenCalled();
  });

  it('returns an empty object when SECRETS_PROVIDER is not set', async () => {
    process.env.ENABLE_BAO = 'true';
    delete process.env.SECRETS_PROVIDER;

    await expect(fetchSecrets(CommonConstants.SMTP_CONFIG)).resolves.toEqual({});
    expect(mockedGetSecretProvider).not.toHaveBeenCalled();
  });

  it('returns an empty object when the provider is unsupported', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'consul';
    mockedGetSecretProvider.mockReturnValue(null);

    await expect(fetchSecrets(CommonConstants.SMTP_CONFIG)).resolves.toEqual({});
    expect(mockedGetSecretProvider).toHaveBeenCalledWith('consul');
  });

  it.each([
    CommonConstants.RESEND_API_KEY as string,
    CommonConstants.SMTP_CONFIG as string,
    CommonConstants.SENDGRID_API_KEY as string,
    CommonConstants.AWS_KEY as string
  ])('fetches secrets for %s via the active provider through the secretKey option', async (secretKey: string) => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    const loadSecrets = jest.fn().mockResolvedValue({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587' });
    mockedGetSecretProvider.mockReturnValue({ name: 'OpenBao', loadSecrets });

    await expect(fetchSecrets(secretKey)).resolves.toEqual({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587'
    });

    expect(loadSecrets).toHaveBeenCalledWith({ secretKey });
  });

  it('caches the result per secret key and does not re-invoke the provider', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    const loadSecrets = jest.fn().mockResolvedValue({ RESEND_API_KEY: 'k' });
    mockedGetSecretProvider.mockReturnValue({ name: 'OpenBao', loadSecrets });

    await fetchSecrets(CommonConstants.RESEND_API_KEY);
    await fetchSecrets(CommonConstants.RESEND_API_KEY);

    expect(loadSecrets).toHaveBeenCalledTimes(1);
  });

  it('uses an independent cache per secret key', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    const loadSecrets = jest.fn().mockResolvedValue({ SOME_KEY: 'v' });
    mockedGetSecretProvider.mockReturnValue({ name: 'OpenBao', loadSecrets });

    await fetchSecrets(CommonConstants.SMTP_CONFIG);
    await fetchSecrets(CommonConstants.RESEND_API_KEY);

    expect(loadSecrets).toHaveBeenCalledTimes(2);
    expect(loadSecrets).toHaveBeenCalledWith({ secretKey: CommonConstants.SMTP_CONFIG });
    expect(loadSecrets).toHaveBeenCalledWith({ secretKey: CommonConstants.RESEND_API_KEY });
  });
});
