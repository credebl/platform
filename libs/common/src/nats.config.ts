import { NATSReconnects } from '@credebl/enum/enum';
import { Authenticator, nkeyAuthenticator } from 'nats';

export const getNatsOptions = (
  nkeySeed?: string, serviceName?: string
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
    // queue: `${CommonConstants.API_GATEWAY_SERVICE}`
    queue: serviceName
  };

  if (nkeySeed) {
    return {
      ...baseOptions,
      authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed))
      // queue: `${CommonConstants.API_GATEWAY_SERVICE}`
    };
  } 
  // else if (nkeySeed && serviceName) {
  //   return {
  //     ...baseOptions,
  //     authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed)),
  //     queue: serviceName
  //   };

  // }

  return baseOptions;
};

