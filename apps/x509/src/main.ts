import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { X509Module } from './x509.module';
import { getNatsOptions } from '@credebl/common/nats.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(X509Module, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.X509_SERVICE, process.env.NATS_CREDS_FILE)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  Logger.log('X509 Microservice is listening to NATS ');
}
bootstrap();
