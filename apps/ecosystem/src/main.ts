import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { EcosystemModule } from './ecosystem.module';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
// import { nkeyAuthenticator } from 'nats';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(EcosystemModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.ECOSYSTEM_SERVICE, process.env.ECOSYSTEM_NKEY_SEED)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Ecosystem Microservice is listening to NATS ');
}
bootstrap();
