import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { LedgerModule } from './ledger.module';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { getNatsOptions } from '@credebl/common/nats.config';
import { loadConfigSecrets } from '@credebl/config/secret-storage/secrets-loader';

dotenv.config();

async function bootstrap(): Promise<void> {
  await loadConfigSecrets();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(LedgerModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.LEDGER_SERVICE, process.env.LEDGER_NKEY_SEED, process.env.NATS_CREDS_FILE)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  Logger.log('Ledger-Service Microservice is listening to NATS ');
}
bootstrap();
