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
      return baseOptions;

    case 'usernamePassword': {
      const user = process.env.NATS_USER;
      const pass = process.env.NATS_PASSWORD;
      if (user && pass) {
        return {
          ...baseOptions,
          authenticator: usernamePasswordAuthenticator(user, pass)
        };
      }
      return baseOptions;
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
      return baseOptions;
  }
};
