export interface SecretProvider {
  /**
   * A human-readable name used for logging purposes (e.g., 'AWS Secrets Manager')
   */
  name: string;

  /**
   * Fetches the secrets from the external service and returns them
   * as a flat key-value object of strings.
   * * @returns A promise resolving to Record<string, string>
   */
  loadSecrets(): Promise<Record<string, string>>;
}
