import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { UtilitiesModule } from './utilities.module';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UtilitiesModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.UTILITIES_NKEY_SEED)

  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('utilities Microservice is listening to NATS ');
}
bootstrap();
