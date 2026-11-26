import * as dotenv from 'dotenv';

import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CloudWalletModule } from './cloud-wallet.module';
import { CommonConstants } from '@credebl/common/common.constant';
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
    CommonConstants.CLOUD_WALLET_SERVICE,
    process.env.CLOUD_WALLET_NKEY_SEED,
    process.env.NATS_CREDS_FILE
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(CloudWalletModule, {
    transport: Transport.NATS,
    options: natsOptions
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  startMicroserviceHealth(app, CommonConstants.CLOUD_WALLET_SERVICE, natsOptions);
  logger.log('Cloud-wallet Microservice is listening to NATS ');
}
bootstrap();
