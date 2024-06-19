import { NATSReconnects } from '@credebl/enum/enum';
import { Authenticator, nkeyAuthenticator } from 'nats';

// export const getNatsOptions = (
//   nkeySeed?: string
// ): {
//   servers: string[];
//   authenticator?: Authenticator;
// } => nkeySeed
// ? {
//         servers: [`${process.env.NATS_URL}`],
//         authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed))
//       }
//     : { servers: [`${process.env.NATS_URL}`] };


export const getNatsOptions = (
  nkeySeed?: string
): {
  servers: string[];
  authenticator?: Authenticator;
  maxReconnectAttempts: NATSReconnects;
  reconnectTimeWait: NATSReconnects;
} => {
  const baseOptions = {
    servers: [`${process.env.NATS_URL}`],
    maxReconnectAttempts: NATSReconnects.maxReconnectAttempts,
    reconnectTimeWait: NATSReconnects.reconnectTimeWait
  };

  if (nkeySeed) {
    return {
      ...baseOptions,
      authenticator: nkeyAuthenticator(new TextEncoder().encode(nkeySeed))
    };
  }

  return baseOptions;
};