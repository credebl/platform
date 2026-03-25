import { readFileSync } from 'node:fs';
import { NATSReconnects } from '../../enum/src/enum';
import { Authenticator, credsAuthenticator } from 'nats';
import path = require('node:path');

export const getNatsOptions = (
  serviceName: string,
  // nkeySeed?: string
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
    // debug: true
  };

  // if (nkeySeed) {
  if (creds) {
    const utf8 = readFileSync(path.resolve(creds));
    return {
      ...baseOptions,
      // authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed))
      authenticator: credsAuthenticator(utf8)
    };
  }
  return baseOptions;
};
