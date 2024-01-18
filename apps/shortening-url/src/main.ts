import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ShorteningUrlModule } from './shortening-url.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ShorteningUrlModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.SHORTENING_URL_NKEY_SEED)

  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Shortening-Url Microservice is listening to NATS ');
}
bootstrap();
