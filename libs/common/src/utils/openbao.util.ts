import { OpenBaoProvider } from 'libs/config/src/secret-storage/openbao.provider';
import { TtlCache } from './ttl-cache.util';

const CACHE_TTL_MS = 10 * 60 * 1000;

const secretCaches = new Map<string, TtlCache<Record<string, string>>>();

export async function fetchOpenBaoSecrets(secretPath: string): Promise<Record<string, string>> {
  let cache = secretCaches.get(secretPath);
  if (!cache) {
    cache = new TtlCache<Record<string, string>>(CACHE_TTL_MS);
    secretCaches.set(secretPath, cache);
  }

  return cache.get(async () => {
    const openBaoProvider = new OpenBaoProvider();
    return openBaoProvider.loadSecrets(secretPath);
  });
}
