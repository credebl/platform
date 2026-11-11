import { IClientDetailsSSO } from '@credebl/common/interfaces/user.interface';
import { encryptClientCredential } from '@credebl/common/cast.helper';

export const getDefaultClient = async (): Promise<IClientDetailsSSO> => ({
  alias: process.env.PLATFORM_NAME?.toUpperCase(),
  domain: process.env.FRONT_END_URL,
  clientId: await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_ID),
  clientSecret: await encryptClientCredential(process.env.KEYCLOAK_MANAGEMENT_CLIENT_SECRET)
});

// Now getting from env, but can get from DB
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
