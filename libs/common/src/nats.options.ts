/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NatsOptions, Transport } from '@nestjs/microservices';
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const commonNatsOptions = (name: string, isClient = true) => {
  const common: NatsOptions = {
    transport: Transport.NATS,
    options: {
      servers: (() => {
        const raw = process.env.NATS_URL ?? '';
        const servers = raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (0 === servers.length) {
          throw new Error('NATS_URL is required and must contain at least one server');
        }
        return servers;
      })(),
      name,
      maxReconnectAttempts: -1,
      reconnectTimeWait: 3000
    }
  };
  const result = isClient ? { ...common, options: { ...common.options, reconnect: true } } : common;
  return result;
};
