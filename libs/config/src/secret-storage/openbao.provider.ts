import { Logger } from '@nestjs/common';
import { SecretProvider } from './secret-provider.interface';

export class OpenBaoProvider implements SecretProvider {
  readonly name = 'OpenBao';
  private readonly logger = new Logger(OpenBaoProvider.name);

  isEnabled(): boolean {
    return 'true' === process.env.ENABLE_BAO?.trim()?.toLowerCase();
  }

  async loadSecrets(customPath: string = ''): Promise<Record<string, string>> {
    const baoUrl = process.env.BAO_URL;
    const secretPath = customPath || process.env.BAO_SECRET_PATH;
    const roleId = process.env.BAO_ROLE_ID;
    const secretId = process.env.BAO_SECRET_ID;
    this.logger.log(`Fetching secrets from ${baoUrl}/v1/${secretPath}`);
    if (!roleId || !secretId) {
      throw new Error('BAO_ROLE_ID and BAO_SECRET_ID must be set.');
    }
    this.logger.log(`Authenticating with AppRole at ${baoUrl}/v1/auth/approle/login`);
    // --- Authentication ---
    const authResponse = await fetch(`${baoUrl}/v1/auth/approle/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // eslint-disable-next-line camelcase
      body: JSON.stringify({ role_id: roleId, secret_id: secretId })
    });
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
    const response = await fetch(`${baoUrl}/v1/${secretPath}`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': baoToken,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Fetch failed: Status ${response.status}`);
    }

    const result = await response.json();
    const secrets = result.data?.data;
    this.logger.log('Successfully fetched secrets from OpenBao');
    if (!secrets || 'object' !== typeof secrets || Array.isArray(secrets)) {
      throw new Error('Unexpected secrets payload structure.');
    }

    return secrets as Record<string, string>;
  }
}
