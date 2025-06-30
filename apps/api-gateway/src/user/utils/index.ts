import { IClientDetailsSSO } from '@credebl/common/interfaces/user.interface';
import { encryptClientCredential } from '@credebl/common/cast.helper';

export const getDefaultClient = async (): Promise<IClientDetailsSSO> => ({
  alias: process.env.PLATFORM_NAME?.toUpperCase(),
  domain: process.env.FRONT_END_URL,
  clientId: await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID),
  clientSecret: await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET)
});

/**
 * Retrieves SSO client details for a given alias from environment variables.
 *
 * Constructs environment variable keys using the provided alias to obtain the client ID, client secret, domain, and alias name. If the alias name is not set in the environment, it defaults to the input alias.
 *
 * @param alias - The identifier used to construct environment variable keys for client credentials
 * @returns An object containing the client ID, client secret, domain, and alias name
 */
function getClientDetails(alias: string): IClientDetailsSSO {
  const clientIdKey = `${alias}_KEYCLOAK_MANAGEMENT_CLIENT_ID`;
  const clientSecretKey = `${alias}_KEYCLOAK_MANAGEMENT_CLIENT_SECRET`;
  const domainKey = `${alias}_DOMAIN`;
  const aliasNameKey = `${alias}_ALIAS`;

  const clientId = process.env[clientIdKey];
  const clientSecret = process.env[clientSecretKey];
  const domain = process.env[domainKey];
  const aliasName = process.env[aliasNameKey] || alias;

  const clientDetails: IClientDetailsSSO = {
    clientId,
    clientSecret,
    domain,
    alias: aliasName
  };

  return clientDetails;
}

/**
 * Retrieves SSO client credentials for the specified alias.
 *
 * If the alias matches the default client alias (case-insensitive), returns the default client details. Otherwise, fetches client details for the given alias from environment variables. Throws an error if required configuration is missing.
 *
 * @param alias - The client alias to retrieve credentials for
 * @returns The SSO client details associated with the alias
 * @throws Error if client ID, client secret, or domain are missing for the specified alias
 */
export async function getCredentialsByAlias(alias: string): Promise<IClientDetailsSSO> {
  const defaultClient = await getDefaultClient();
  if (alias.toUpperCase() === defaultClient.alias) {
    return defaultClient;
  }

  const clientDetails = getClientDetails(alias);

  if (!clientDetails.clientId || !clientDetails.clientSecret || !clientDetails.domain) {
    throw new Error(`Missing configuration for SSO client: ${alias}`);
  }

  return clientDetails;
}
