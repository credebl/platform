import { fetchSecrets } from './secretLoader.util';
import { getSecretProvider } from 'libs/config/src/secret-storage/secrets-loader';

jest.mock('libs/config/src/secret-storage/secrets-loader', () => ({
  getSecretProvider: jest.fn()
}));

const mockedGetSecretProvider = getSecretProvider as jest.MockedFunction<typeof getSecretProvider>;

describe('fetchSecrets', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.ENABLE_BAO;
    delete process.env.SECRETS_PROVIDER;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns an empty object when OpenBao is disabled', async () => {
    process.env.ENABLE_BAO = 'false';

    await expect(fetchSecrets('secret/data/credebl_smtp_config')).resolves.toEqual({});
    expect(mockedGetSecretProvider).not.toHaveBeenCalled();
  });

  it('returns an empty object when SECRETS_PROVIDER is not set', async () => {
    process.env.ENABLE_BAO = 'true';
    delete process.env.SECRETS_PROVIDER;

    await expect(fetchSecrets('secret/data/credebl_smtp_config_2')).resolves.toEqual({});
    expect(mockedGetSecretProvider).not.toHaveBeenCalled();
  });

  it('returns an empty object when the provider is unsupported', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'consul';
    mockedGetSecretProvider.mockReturnValue(null);

    await expect(fetchSecrets('secret/data/credebl_smtp_config_3')).resolves.toEqual({});
    expect(mockedGetSecretProvider).toHaveBeenCalledWith('consul');
  });

  it('fetches the secrets for the requested path via the active provider', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    const loadSecrets = jest.fn().mockResolvedValue({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587' });
    mockedGetSecretProvider.mockReturnValue({ name: 'OpenBao', loadSecrets });

    await expect(fetchSecrets('secret/data/credebl_smtp_config_4')).resolves.toEqual({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587'
    });

    expect(loadSecrets).toHaveBeenCalledWith({ customPath: 'secret/data/credebl_smtp_config_4' });
  });

  it('caches the result per path and does not re-invoke the provider', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    const loadSecrets = jest.fn().mockResolvedValue({ RESEND_API_KEY: 'k' });
    mockedGetSecretProvider.mockReturnValue({ name: 'OpenBao', loadSecrets });

    await fetchSecrets('secret/data/credebl_resend_api_key');
    await fetchSecrets('secret/data/credebl_resend_api_key');

    expect(loadSecrets).toHaveBeenCalledTimes(1);
  });

  it('uses an independent cache per secret path', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    const loadSecrets = jest.fn().mockResolvedValue({ SOME_KEY: 'v' });
    mockedGetSecretProvider.mockReturnValue({ name: 'OpenBao', loadSecrets });

    await fetchSecrets('secret/data/path_a');
    await fetchSecrets('secret/data/path_b');

    expect(loadSecrets).toHaveBeenCalledTimes(2);
    expect(loadSecrets).toHaveBeenCalledWith({ customPath: 'secret/data/path_a' });
    expect(loadSecrets).toHaveBeenCalledWith({ customPath: 'secret/data/path_b' });
  });
});
