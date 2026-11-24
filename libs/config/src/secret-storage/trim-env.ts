/**
 * Keys whose values must be kept verbatim.
 * - `CRYPTO_PRIVATE_KEY` is an encryption secret: trimming it would change the derived key and make
 *   previously encrypted data unreadable.
 * - `SMTP_PASS` is a password: leading/trailing spaces may be significant, and it is passed unchanged
 *   to the SMTP server, so trimming could break authentication.
 */
export const UNTRIMMED_ENV_KEYS: ReadonlySet<string> = new Set(['CRYPTO_PRIVATE_KEY', 'SMTP_PASS']);

/**
 * Removes leading/trailing whitespace from every environment variable value, except those listed in
 * `UNTRIMMED_ENV_KEYS`.
 *
 * `dotenv` already trims unquoted values from a `.env` file, but values supplied by a container
 * platform (ECS task definitions, Kubernetes manifests, `docker -e`, Secrets Manager / SSM) are kept
 * verbatim, so a stray space can break SMTP, Keycloak, DATABASE_URL, NATS_URL etc. at runtime.
 *
 * @param env The environment object to normalise in place. Defaults to `process.env`.
 */
export function trimEnvVariables(env: NodeJS.ProcessEnv = process.env): void {
  for (const [key, value] of Object.entries(env)) {
    if ('string' !== typeof value || UNTRIMMED_ENV_KEYS.has(key)) {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed !== value) {
      env[key] = trimmed;
    }
  }
}
