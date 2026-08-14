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

  private readonly secretPathMap: Record<string, string> = {
    [CommonConstants.RESEND_API_KEY]: 'secret/data/credebl_resend_api_key',
    [CommonConstants.SMTP_CONFIG]: 'secret/data/credebl_smtp_config',
    [CommonConstants.SENDGRID_API_KEY]: 'secret/data/credebl_sendgrid_api_key',
    [CommonConstants.AWS_KEY]: 'secret/data/credebl_aws_keys'
  };

  isEnabled(): boolean {
    return 'true' === process.env.ENABLE_BAO?.trim()?.toLowerCase();
  }

  async loadSecrets(options?: { secretKey?: string }): Promise<Record<string, string>> {
    const baoUrl = process.env.BAO_URL;
    const secretPath = this.resolveSecretPath(options?.secretKey);
    const roleId = process.env.BAO_ROLE_ID;
    const secretId = process.env.BAO_SECRET_ID;
    if (!baoUrl || !secretPath || !roleId || !secretId) {
      throw new Error('BAO_URL, BAO_SECRET_PATH, BAO_ROLE_ID, and BAO_SECRET_ID must be set.');
    }
    this.logger.log(`Fetching secrets from ${baoUrl}/v1/${secretPath}`);
    this.logger.log(`Authenticating with AppRole at ${baoUrl}/v1/auth/approle/login`);

    const authData = await this.sendRequest<{ auth?: { client_token?: string } }>(
      `${baoUrl}/v1/auth/approle/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // eslint-disable-next-line camelcase
        body: JSON.stringify({ role_id: roleId, secret_id: secretId })
      },
      'Authentication failed',
      'OpenBao authentication request timed out.'
    );

    const baoToken = authData.auth?.client_token;

    if (!baoToken) {
      throw new Error('Failed to retrieve client token from OpenBao.');
    }
    this.logger.log(`Fetching secrets from ${baoUrl}/v1/${secretPath}`);

    const secretsData = await this.sendRequest<{ data?: { data?: Record<string, string> } }>(
      `${baoUrl}/v1/${secretPath}`,
      {
        method: 'GET',
        headers: {
          'X-Vault-Token': baoToken,
          'Content-Type': 'application/json'
        }
      },
      'Fetch failed',
      'OpenBao secrets fetch request timed out.'
    );

    const secrets = secretsData.data?.data;
    this.logger.log('Successfully fetched secrets from OpenBao');
    if (!secrets || 'object' !== typeof secrets || Array.isArray(secrets)) {
      throw new Error('Unexpected secrets payload structure.');
    }

    return secrets as Record<string, string>;
  }

  private resolveSecretPath(secretKey?: string): string | undefined {
    if (!secretKey) {
      return process.env.BAO_SECRET_PATH;
    }
    const secretPath = this.secretPathMap[secretKey];
    if (!secretPath) {
      throw new Error(`No OpenBao path mapped for secret key: ${secretKey}`);
    }
    return secretPath;
  }

  private async sendRequest<T>(
    url: string,
    init: RequestInit,
    statusErrorMessage: string,
    timeoutErrorMessage: string
  ): Promise<T> {
    try {
      const response = await fetchWithTimeout(url, init, CommonConstants.OPENBAO_REQUEST_TIMEOUT);
      if (!response.ok) {
        throw new Error(`${statusErrorMessage}: Status ${response.status}`);
      }
      const body = await response.json();
      return body as T;
    } catch (error) {
      if (error instanceof DOMException && 'AbortError' === error.name) {
        throw new Error(timeoutErrorMessage);
      }
      throw error;
    }
  }
}
