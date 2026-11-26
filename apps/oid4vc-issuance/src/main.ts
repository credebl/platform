import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { Oid4vcIssuanceModule } from './oid4vc-issuance.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { startMicroserviceHealth } from '@credebl/common/health/health-server';
import { loadConfigSecrets } from '@credebl/config/secret-storage/secrets-loader';

dotenv.config();

const logger = new Logger();

async function bootstrap(): Promise<void> {
  await loadConfigSecrets();

  if (!process.env.STATUS_LIST_HOST) {
    logger.warn('STATUS_LIST_HOST is not configured. Revocable SD-JWT flow will be disabled.');
  }

  const natsOptions = getNatsOptions(
    CommonConstants.OIDC4VC_ISSUANCE_SERVICE,
    process.env.OIDC4VC_ISSUANCE_NKEY_SEED,
    process.env.NATS_CREDS_FILE
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(Oid4vcIssuanceModule, {
    transport: Transport.NATS,
    options: natsOptions
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  startMicroserviceHealth(app, CommonConstants.OIDC4VC_ISSUANCE_SERVICE, natsOptions);
  logger.log('OID4VC-Issuance-Service Microservice is listening to NATS ');
}
bootstrap();
