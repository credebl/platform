import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { OrganizationModule } from './organization.module';
// import { nkeyAuthenticator } from 'nats';
import { getNatsOptions } from '@credebl/common/nats.config';
import { loadConfigSecrets } from '@credebl/config/secret-storage/secrets-loader';

dotenv.config();

const logger = new Logger();

async function bootstrap(): Promise<void> {
  await loadConfigSecrets();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrganizationModule, {
    transport: Transport.NATS,
    options: getNatsOptions(
      CommonConstants.ORGANIZATION_SERVICE,
      process.env.ORGANIZATION_NKEY_SEED,
      process.env.NATS_CREDS_FILE
    )
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Organization Microservice is listening to NATS ');
}
bootstrap();
