import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConnectionModule } from './connection.module';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { getNatsOptions } from '@credebl/common/nats.config';
import { startMicroserviceHealth } from '@credebl/common/health/health-server';
import { loadConfigSecrets } from '@credebl/config/secret-storage/secrets-loader';

dotenv.config();

const logger = new Logger();

async function bootstrap(): Promise<void> {
  await loadConfigSecrets();
  const natsOptions = getNatsOptions(
    CommonConstants.CONNECTION_SERVICE,
    process.env.CONNECTION_NKEY_SEED,
    process.env.NATS_CREDS_FILE
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ConnectionModule, {
    transport: Transport.NATS,
    options: natsOptions
  });

  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  startMicroserviceHealth(app, CommonConstants.CONNECTION_SERVICE, natsOptions);
  logger.log('Connection-Service Microservice is listening to NATS ');
}
bootstrap();
