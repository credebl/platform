import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { GeoLocationModule } from './geo-location.module';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(GeoLocationModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.GEOLOCATION_NKEY_SEED)
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('geo-location Microservice is listening to NATS ');
}
bootstrap();
