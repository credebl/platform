import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { X509Module } from './x509.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { startMicroserviceHealth } from '@credebl/common/health/health-server';
import { loadConfigSecrets } from '@credebl/config/secret-storage/secrets-loader';

dotenv.config();

async function bootstrap(): Promise<void> {
  await loadConfigSecrets();
  const natsOptions = getNatsOptions(
    CommonConstants.X509_SERVICE,
    process.env.X509_NKEY_SEED,
    process.env.NATS_CREDS_FILE
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(X509Module, {
    transport: Transport.NATS,
    options: natsOptions
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  startMicroserviceHealth(app, CommonConstants.X509_SERVICE, natsOptions);
  Logger.log('X509 Microservice is listening to NATS ');
}
bootstrap();
