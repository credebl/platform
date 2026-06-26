import { SecretProvider } from './secret-provider.interface';

export class OpenBaoProvider implements SecretProvider {
  readonly name = 'OpenBao';

  isEnabled(): boolean {
    return 'true' === process.env.ENABLE_BAO?.trim()?.toLowerCase();
  }

  async loadSecrets(customPath:string = ''): Promise<Record<string, string>> {
    const baoUrl = process.env.BAO_URL;
    const secretPath = customPath || process.env.BAO_SECRET_PATH;
    const roleId = process.env.BAO_ROLE_ID;
    const secretId = process.env.BAO_SECRET_ID;
    console.log(`🔐 OpenBaoProvider: Fetching secrets from ${baoUrl}/v1/${secretPath} with roleId=${roleId}`);
    if (!roleId || !secretId) {
      throw new Error('BAO_ROLE_ID and BAO_SECRET_ID must be set.');
    }
    console.log(`🔐 OpenBaoProvider: Using roleId=${roleId} and secretId=${secretId}`);
    console.log(`${baoUrl}/v1/auth/approle/login`)
    // --- Authentication ---
    const authResponse = await fetch(`${baoUrl}/v1/auth/approle/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // eslint-disable-next-line camelcase
      body: JSON.stringify({ role_id: roleId, secret_id: secretId })
    })
    console.log(`🔐 OpenBaoProvider: Authentication response status: ${authResponse}`);
    if (!authResponse.ok) {
      throw new Error(`Authentication failed: Status ${authResponse.status}`);
    }
    
    const authData = await authResponse.json();
    console.log("authresponse", authData);
    const baoToken = authData.auth?.client_token;

    if (!baoToken) {
      throw new Error('Failed to retrieve client token from OpenBao.');
    }
    console.log("request url",`${baoUrl}/v1/${secretPath}`)
    // --- Fetch Secrets ---
    const response = await fetch(`${baoUrl}/v1/${secretPath}`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': baoToken,
        'Content-Type': 'application/json'
      }
    });
    console.log(`🔐 OpenBaoProvider: Fetch secrets response status: ${response}`);
    if (!response.ok) {
      console.log("inside not ok")
      throw new Error(`Fetch failed: Status ${response.status}`);
    }

    const result = await response.json();
    const secrets = result.data?.data;
    console.log('🔐 Successfully fetched secrets from OpenBao', result);
    if (!secrets || 'object' !== typeof secrets || Array.isArray(secrets)) {
      throw new Error('Unexpected secrets payload structure.');
    }

    return secrets as Record<string, string>;
  }
}
