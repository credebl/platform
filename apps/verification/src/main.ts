import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { VerificationModule } from './verification.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { startMicroserviceHealth } from '@credebl/common/health/health-server';
import { loadConfigSecrets } from '@credebl/config/secret-storage/secrets-loader';

dotenv.config();

const logger = new Logger();

async function bootstrap(): Promise<void> {
  await loadConfigSecrets();
  const natsOptions = getNatsOptions(
    CommonConstants.VERIFICATION_SERVICE,
    process.env.VERIFICATION_NKEY_SEED,
    process.env.NATS_CREDS_FILE
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(VerificationModule, {
    transport: Transport.NATS,
    options: natsOptions
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  startMicroserviceHealth(app, CommonConstants.VERIFICATION_SERVICE, natsOptions);
  logger.log('Verification-Service Microservice is listening to NATS ');
}
bootstrap();
