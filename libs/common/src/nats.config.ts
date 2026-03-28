import { readFileSync } from 'node:fs';
import { NATSReconnects } from '../../enum/src/enum';
import { Authenticator, credsAuthenticator, nkeyAuthenticator, usernamePasswordAuthenticator } from 'nats';
import path = require('node:path');

export type NatsAuthType = 'nkey' | 'creds' | 'usernamePassword' | 'none';

export const getNatsOptions = (
  serviceName: string,
  nkeySeed?: string,
  creds?: string
): {
  servers: string[];
  authenticator?: Authenticator;
  maxReconnectAttempts: NATSReconnects;
  reconnectTimeWait: NATSReconnects;
  queue?: string;
} => {
  const baseOptions = {
    servers: `${process.env.NATS_URL}`.split(','),
    maxReconnectAttempts: NATSReconnects.maxReconnectAttempts,
    reconnectTimeWait: NATSReconnects.reconnectTimeWait,
    queue: serviceName
  };

  const authType = (process.env.NATS_AUTH_TYPE as NatsAuthType) || 'nkey';

  switch (authType) {
    case 'creds':
      if (creds) {
        const utf8 = readFileSync(path.resolve(creds));
        return {
          ...baseOptions,
          authenticator: credsAuthenticator(utf8)
        };
      }
      throw new Error(`NATS_AUTH_TYPE is 'creds' but NATS_CREDS_FILE is not provided for service: ${serviceName}`);

    case 'usernamePassword': {
      const user = process.env.NATS_USER;
      const pass = process.env.NATS_PASSWORD;
      if (user && pass) {
        return {
          ...baseOptions,
          authenticator: usernamePasswordAuthenticator(user, pass)
        };
      }
      throw new Error(
        `NATS_AUTH_TYPE is 'usernamePassword' but NATS_USER or NATS_PASSWORD is not provided for service: ${serviceName}`
      );
    }
    case 'none':
      return baseOptions;

    case 'nkey':
    default:
      if (nkeySeed) {
        return {
          ...baseOptions,
          authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed))
        };
      }
      throw new Error(`NATS_AUTH_TYPE is 'nkey' but NKEY_SEED is not provided for service: ${serviceName}`);
  }
};
