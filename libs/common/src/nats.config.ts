import { Authenticator, nkeyAuthenticator } from 'nats';

export const getNatsOptions = (
  nkeySeed?: string
): {
  servers: string[];
  authenticator?: Authenticator;
} => nkeySeed
? {
        servers: [`${process.env.NATS_URL}`],
        authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed))
      }
    : { servers: [`${process.env.NATS_URL}`] };
