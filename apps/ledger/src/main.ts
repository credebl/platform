import { NestFactory } from '@nestjs/core';
import { LedgerModule } from './ledger.module';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(LedgerModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.LEDGER_SERVICE, process.env.LEDGER_NKEY_SEED)

  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  Logger.log('Ledger-Service Microservice is listening to NATS ');
}
bootstrap();
