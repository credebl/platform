import { CommonConstants } from '@credebl/common/common.constant';
import { Logger } from '@nestjs/common';
import { SecretProvider } from './secret-provider.interface';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class OpenBaoProvider implements SecretProvider {
  readonly name = 'OpenBao';
  private readonly logger = new Logger(OpenBaoProvider.name);

  isEnabled(): boolean {
    return 'true' === process.env.ENABLE_BAO?.trim()?.toLowerCase();
  }

  async loadSecrets(options?: { customPath?: string }): Promise<Record<string, string>> {
    const baoUrl = process.env.BAO_URL;
    const secretPath = options?.customPath || process.env.BAO_SECRET_PATH;
    const roleId = process.env.BAO_ROLE_ID;
    const secretId = process.env.BAO_SECRET_ID;
    if (!baoUrl || !secretPath || !roleId || !secretId) {
      throw new Error('BAO_URL, BAO_SECRET_PATH, BAO_ROLE_ID, and BAO_SECRET_ID must be set.');
    }
    this.logger.log(`Fetching secrets from ${baoUrl}/v1/${secretPath}`);
    this.logger.log(`Authenticating with AppRole at ${baoUrl}/v1/auth/approle/login`);
    // --- Authentication ---
    let authResponse: Response;
    try {
      authResponse = await fetchWithTimeout(
        `${baoUrl}/v1/auth/approle/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // eslint-disable-next-line camelcase
          body: JSON.stringify({ role_id: roleId, secret_id: secretId })
        },
        CommonConstants.OPENBAO_REQUEST_TIMEOUT
      );
    } catch (error) {
      if (error instanceof DOMException && 'AbortError' === error.name) {
        throw new Error('OpenBao authentication request timed out.');
      }
      throw error;
    }
    if (!authResponse.ok) {
      throw new Error(`Authentication failed: Status ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const baoToken = authData.auth?.client_token;

    if (!baoToken) {
      throw new Error('Failed to retrieve client token from OpenBao.');
    }
    this.logger.log(`Fetching secrets from ${baoUrl}/v1/${secretPath}`);
    // --- Fetch Secrets ---
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${baoUrl}/v1/${secretPath}`,
        {
          method: 'GET',
          headers: {
            'X-Vault-Token': baoToken,
            'Content-Type': 'application/json'
          }
        },
        CommonConstants.OPENBAO_REQUEST_TIMEOUT
      );
    } catch (error) {
      if (error instanceof DOMException && 'AbortError' === error.name) {
        throw new Error('OpenBao secrets fetch request timed out.');
      }
      throw error;
    }
    if (!response.ok) {
      throw new Error(`Fetch failed: Status ${response.status}`);
    }

    const result = await response.json();
    const secrets = result.data?.data;
    this.logger.log('Successfully fetched secrets from OpenBao', secrets);
    if (!secrets || 'object' !== typeof secrets || Array.isArray(secrets)) {
      throw new Error('Unexpected secrets payload structure.');
    }

    return secrets as Record<string, string>;
  }
}
