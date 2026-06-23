// import { AwsSecretsProvider } from './providers/aws-secrets.provider';
// libs/config/src/secrets-loader.ts
import { Logger } from '@nestjs/common';
import { OpenBaoProvider } from './openbao.provider';
import { SecretProvider } from './secret-provider.interface';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const logger = new Logger('SecretsLoader');

/**
 * Factory function to get the requested secret provider
 */
function getSecretProvider(providerType: string): SecretProvider | null {
  switch (providerType.toLowerCase()) {
    case 'openbao':
      return new OpenBaoProvider();

    default:
      return null;
  }
}

export async function loadConfigSecrets(): Promise<void> {
  const providerType = process.env.SECRETS_PROVIDER?.trim();

  if (!providerType) {
    logger.log('SECRETS_PROVIDER not set. Skipping remote secrets fetching.');
    return;
  }

  const provider = getSecretProvider(providerType);

  if (!provider) {
    logger.warn(
      `⚠️ Unsupported SECRETS_PROVIDER value "${providerType}". Falling back to local environment variables.`
    );
    return;
  }

  logger.log(`Secrets management enabled via [${provider.name}]. Fetching...`);

  try {
    const secrets = await provider.loadSecrets();

    for (const [key, value] of Object.entries(secrets)) {
      if (FORBIDDEN_KEYS.has(key)) {
        continue;
      }

      Object.defineProperty(process.env, key, {
        value: String(value),
        enumerable: true,
        configurable: true,
        writable: true
      });
    }

    logger.log(`Successfully injected secrets from ${provider.name} into process.env`);
  } catch (error) {
    // Safely handles instances where error might not be a standard Error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Critical Lifecycle Boot Failure (${provider.name}): ${errorMessage}`);
    throw new Error(`Failed to load secrets from ${provider.name}`);
  }
}
