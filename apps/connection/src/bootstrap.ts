import { NestFactory } from '@nestjs/core';
import { Logger, Provider } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConnectionModule } from './connection.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';

const logger = new Logger();

export async function bootstrapConnectionService(
  overrides: Provider[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllerOverrides: any[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedModules: any[] = []
): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ConnectionModule.register(overrides, controllerOverrides, importedModules),
    {
      transport: Transport.NATS,
      options: getNatsOptions(
        CommonConstants.CONNECTION_SERVICE,
        process.env.CONNECTION_NKEY_SEED,
        process.env.NATS_CREDS_FILE
      )
    }
  );

  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  await app.listen();
  logger.log('Connection-Service Microservice is listening to NATS');
}
