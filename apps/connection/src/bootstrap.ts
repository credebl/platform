import { NestFactory } from '@nestjs/core';
import { ConnectionModule } from './connection.module';
import { HttpExceptionFilter } from '@credebl/common';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common';
import { CommonConstants } from '@credebl/common';
import { NestjsLoggerServiceAdapter } from '@credebl/logger';
import type { Provider } from '@nestjs/common';

const logger = new Logger();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function bootstrapConnectionService(
  providers: Provider[] = [],
  controllers: any[] = [],
  imports: any[] = []
): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ConnectionModule.register(providers, controllers, imports),
    {
      transport: Transport.NATS,
      options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED)
    }
  );

  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Connection-Service Microservice is listening to NATS');
}
