/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NatsOptions, Transport } from '@nestjs/microservices';
// import { nkeyAuthenticator } from 'nats';
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const commonNatsOptions = (name: string, isClient = true) => {
  const common: NatsOptions = {
    transport: Transport.NATS,
    options: {
      url: `nats://${process.env.NATS_HOST}:${process.env.NATS_PORT}`,
      // authenticator: nkeyAuthenticator(new TextEncoder().encode('SUADBTFIXH3YRTN3HR33SKP7SWEGW62MAXHCXPIAJHPVVUOVDLU3TPA53M')),
      name,
      maxReconnectAttempts: -1,
      reconnectTimeWait: 3000
    }
  };
  const result = isClient
    ? { ...common, options: { ...common.options, reconnect: true } }
    : common;
  return result;
};
