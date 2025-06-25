/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NatsOptions, Transport } from '@nestjs/microservices';
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const commonNatsOptions = (name: string, isClient = true) => {
  const common: NatsOptions = {
    transport: Transport.NATS,
    options: {
      url: `nats://${process.env.NATS_HOST}:${process.env.NATS_PORT}`,
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
