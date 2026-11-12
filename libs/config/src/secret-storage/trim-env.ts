/**
 * Removes leading/trailing whitespace from every environment variable value.
 *
 * `dotenv` already trims unquoted values from a `.env` file, but values supplied by a container
 * platform (ECS task definitions, Kubernetes manifests, `docker -e`, Secrets Manager / SSM) are kept
 * verbatim, so a stray space can break SMTP, Keycloak, DATABASE_URL, NATS_URL etc. at runtime.
 */
export function trimEnvVariables(env: NodeJS.ProcessEnv = process.env): void {
  for (const [key, value] of Object.entries(env)) {
    if ('string' !== typeof value) {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed !== value) {
      env[key] = trimmed;
    }
  }
}
