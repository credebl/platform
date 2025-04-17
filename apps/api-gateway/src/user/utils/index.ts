import { IClientDetailsSSO } from '@credebl/common/interfaces/user.interface';
import { ClientAlias } from '@credebl/enum/enum';

export function getCredentialsByAlias(alias: ClientAlias): IClientDetailsSSO {
  const registry = {
    EDUCREDS: {
      domain: process.env.EDUCREDS_DOMAIN,
      clientId: process.env.EDUCREDS_KEYCLOAK_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.EDUCREDS_KEYCLOAK_MANAGEMENT_CLIENT_SECRET
    },
    SOVIO: {
      domain: process.env.SOVIO_DOMAIN,
      clientId: process.env.SOVIO_KEYCLOAK_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.SOVIO_KEYCLOAK_MANAGEMENT_CLIENT_SECRET
    }
  };
  return registry[alias];
}
