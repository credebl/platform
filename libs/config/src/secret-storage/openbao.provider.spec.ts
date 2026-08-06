import { OpenBaoProvider } from './openbao.provider';

describe('OpenBaoProvider', () => {
  const originalEnv = { ...process.env };

  let provider: OpenBaoProvider;
  let fetchMock: jest.Mock;

  function jsonResponse(body: unknown, ok = true, status = 200): Response {
    return {
      ok,
      status,
      json: jest.fn().mockResolvedValue(body)
    } as unknown as Response;
  }

  beforeEach(() => {
    provider = new OpenBaoProvider();
    process.env.BAO_URL = 'http://bao:8200';
    process.env.BAO_SECRET_PATH = 'secret/data/credebl_resend_api_key';
    process.env.BAO_ROLE_ID = 'role-id';
    process.env.BAO_SECRET_ID = 'secret-id';

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('rejects when any required environment variable is missing', async () => {
    delete process.env.BAO_ROLE_ID;

    await expect(provider.loadSecrets()).rejects.toThrow(
      'BAO_URL, BAO_SECRET_PATH, BAO_ROLE_ID, and BAO_SECRET_ID must be set.'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('authenticates with AppRole and fetches secrets from the configured path', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth: { client_token: 'client-token' } }))
      .mockResolvedValueOnce(jsonResponse({ data: { data: { RESEND_API_KEY: 'resend-key' } } }));

    await expect(provider.loadSecrets()).resolves.toEqual({ RESEND_API_KEY: 'resend-key' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://bao:8200/v1/auth/approle/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ role_id: 'role-id', secret_id: 'secret-id' })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://bao:8200/v1/secret/data/credebl_resend_api_key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'X-Vault-Token': 'client-token' })
      })
    );
  });

  it('fetches from a custom path when one is supplied', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth: { client_token: 'client-token' } }))
      .mockResolvedValueOnce(jsonResponse({ data: { data: { KEY: 'value' } } }));

    await provider.loadSecrets({ customPath: 'secret/data/credebl_smtp_config' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://bao:8200/v1/secret/data/credebl_smtp_config',
      expect.anything()
    );
  });

  it('rejects when the AppRole login response is not ok', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500));

    await expect(provider.loadSecrets()).rejects.toThrow('Authentication failed: Status 500');
  });

  it('rejects when the login response carries no client token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ auth: {} }));

    await expect(provider.loadSecrets()).rejects.toThrow('Failed to retrieve client token from OpenBao.');
  });

  it('rejects when the secrets fetch response is not ok', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth: { client_token: 'client-token' } }))
      .mockResolvedValueOnce(jsonResponse({}, false, 404));

    await expect(provider.loadSecrets()).rejects.toThrow('Fetch failed: Status 404');
  });

  it('rejects when the payload has an unexpected structure', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth: { client_token: 'client-token' } }))
      .mockResolvedValueOnce(jsonResponse({ data: {} }));

    await expect(provider.loadSecrets()).rejects.toThrow('Unexpected secrets payload structure.');
  });

  it('rejects when the payload data is an array', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth: { client_token: 'client-token' } }))
      .mockResolvedValueOnce(jsonResponse({ data: { data: [] } }));

    await expect(provider.loadSecrets()).rejects.toThrow('Unexpected secrets payload structure.');
  });

  it('rejects with a timeout error when the login request is aborted', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(provider.loadSecrets()).rejects.toThrow('OpenBao authentication request timed out.');
  });

  it('rejects with a timeout error when the secrets fetch is aborted', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth: { client_token: 'client-token' } }))
      .mockRejectedValueOnce(new DOMException('The operation was aborted.', 'AbortError'));

    await expect(provider.loadSecrets()).rejects.toThrow('OpenBao secrets fetch request timed out.');
  });
});
