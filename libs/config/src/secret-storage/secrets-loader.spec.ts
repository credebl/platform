import { OpenBaoProvider } from './openbao.provider';
import { getSecretProvider, loadConfigSecrets } from './secrets-loader';

jest.mock('./openbao.provider', () => ({
  OpenBaoProvider: jest.fn()
}));

const MockedOpenBaoProvider = OpenBaoProvider as unknown as jest.Mock;

describe('getSecretProvider', () => {
  it('returns an OpenBaoProvider for the "openbao" value', () => {
    expect(getSecretProvider('openbao')).toBeInstanceOf(OpenBaoProvider);
  });

  it('matches the provider type case-insensitively', () => {
    expect(getSecretProvider('OpenBao')).toBeInstanceOf(OpenBaoProvider);
    expect(getSecretProvider('OPENBAO')).toBeInstanceOf(OpenBaoProvider);
  });

  it('returns null for unsupported provider types', () => {
    expect(getSecretProvider('consul')).toBeNull();
    expect(getSecretProvider('aws')).toBeNull();
    expect(getSecretProvider('')).toBeNull();
  });
});

describe('loadConfigSecrets', () => {
  const originalEnv = { ...process.env };
  let loadSecrets: jest.Mock;

  beforeEach(() => {
    delete process.env.ENABLE_BAO;
    delete process.env.SECRETS_PROVIDER;
    loadSecrets = jest.fn();
    MockedOpenBaoProvider.mockImplementation(() => ({
      name: 'OpenBao',
      loadSecrets
    }));
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('skips remote fetching when ENABLE_BAO is not "true"', async () => {
    process.env.ENABLE_BAO = 'false';
    process.env.SECRETS_PROVIDER = 'openbao';

    await loadConfigSecrets();

    expect(loadSecrets).not.toHaveBeenCalled();
  });

  it('skips remote fetching when SECRETS_PROVIDER is not set', async () => {
    process.env.ENABLE_BAO = 'true';
    delete process.env.SECRETS_PROVIDER;

    await loadConfigSecrets();

    expect(loadSecrets).not.toHaveBeenCalled();
  });

  it('logs a warning and continues for an unsupported provider', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'consul';

    await expect(loadConfigSecrets()).resolves.toBeUndefined();

    expect(loadSecrets).not.toHaveBeenCalled();
  });

  it('injects fetched secrets into process.env', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    loadSecrets.mockResolvedValue({ SMTP_HOST: 'smtp.example.com', SMTP_PASS: 'secret' });

    await loadConfigSecrets();

    expect(process.env.SMTP_HOST).toBe('smtp.example.com');
    expect(process.env.SMTP_PASS).toBe('secret');
  });

  it('skips forbidden prototype-pollution keys during injection', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    loadSecrets.mockResolvedValue({ __proto__: { polluted: true }, constructor: 'x', SAFE: 'y' });

    await loadConfigSecrets();

    expect((process.env as Record<string, string> & { polluted?: boolean }).polluted).toBeUndefined();
    expect(process.env.SAFE).toBe('y');
  });

  it('logs a critical boot failure and resolves when the provider rejects', async () => {
    process.env.ENABLE_BAO = 'true';
    process.env.SECRETS_PROVIDER = 'openbao';
    loadSecrets.mockRejectedValue(new Error('BAO is down'));

    await expect(loadConfigSecrets()).resolves.toBeUndefined();

    expect(process.env.SMTP_HOST).toBeUndefined();
  });
});
