import { Authenticator, credsAuthenticator } from 'nats';

import { NATSReconnects } from '../../enum/src/enum';
import { readFileSync } from 'node:fs';

import path = require('node:path');

export const getNatsOptions = (
  serviceName: string,
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
    queue: serviceName,
    debug: true
  };

  if (creds) {
    const utf8 = readFileSync(path.resolve(creds));
    return {
      ...baseOptions,
      authenticator: credsAuthenticator(utf8)
    };
  }

  return baseOptions;
};
