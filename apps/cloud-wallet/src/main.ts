import { NestFactory } from '@nestjs/core';
import { CloudWalletModule } from './cloud-wallet.module';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(CloudWalletModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.CONNECTION_NKEY_SEED)
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Cloud-wallet Microservice is listening to NATS ');
}
bootstrap();
