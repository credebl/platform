import { Authenticator, nkeyAuthenticator } from 'nats';

export const getNatsOptions = (): {
    servers: string[];
    authenticator: Authenticator;
  } => ({
    servers: [`${process.env.NATS_URL}`],
    authenticator: nkeyAuthenticator(new TextEncoder().encode(process.env.NKEY_SEED))
  });