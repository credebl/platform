import { NatsOptions, Transport } from '@nestjs/microservices';
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
