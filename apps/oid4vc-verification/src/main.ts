import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { Oid4vpModule } from './oid4vc-verification.module';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(Oid4vpModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.OIDC4VC_VERIFICATION_SERVICE, process.env.OIDC4VC_VERIFICATION_NKEY_SEED)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  // TODO: Not sure if we want the below
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('OID4VC-Verification-Service Microservice is listening to NATS ');
}
bootstrap();
