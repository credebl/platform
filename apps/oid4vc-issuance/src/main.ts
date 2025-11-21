import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { Oid4vcIssuanceModule } from './oid4vc-issuance.module';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(Oid4vcIssuanceModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.OIDC4VC_ISSUANCE_SERVICE, process.env.OIDC4VC_ISSUANCE_NKEY_SEED)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('OID4VC-Issuance-Service Microservice is listening to NATS ');
}
bootstrap();
