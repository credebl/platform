import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { Oid4vpModule } from './oid4vc-verification.module';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(Oid4vpModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.OIDC4VC_VERIFICATION_SERVICE, process.env.NATS_CREDS_FILE)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  // TODO: Not sure if we want the below
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('OID4VC-Verification-Service Microservice is listening to NATS ');
}
bootstrap();
