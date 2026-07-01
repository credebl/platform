import { TtlCache } from './ttl-cache.util';
import { getSecretProvider } from 'libs/config/src/secret-storage/secrets-loader';

const CACHE_TTL_MS = 10 * 60 * 1000;

const secretCaches = new Map<string, TtlCache<Record<string, string>>>();

export async function fetchSecrets(secretPath: string): Promise<Record<string, string>> {
  if ('true' !== process.env.ENABLE_BAO?.trim()?.toLowerCase()) {
    return {};
  }
  let cache = secretCaches.get(secretPath);
  if (!cache) {
    cache = new TtlCache<Record<string, string>>(CACHE_TTL_MS);
    secretCaches.set(secretPath, cache);
  }
  return cache.get(async () => {
    const providerType = process.env.SECRETS_PROVIDER?.trim();
    if (!providerType) {
      return {};
    }
    const provider = getSecretProvider(providerType);
    if (!provider) {
      return {};
    }
    return provider.loadSecrets({ customPath: secretPath });
  });
}
