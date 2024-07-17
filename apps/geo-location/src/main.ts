import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { GeoLocationModule } from './geo-location.module';
import { CommonConstants } from '@credebl/common/common.constant';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(GeoLocationModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.GEO_LOCATION_SERVICE, process.env.GEOLOCATION_NKEY_SEED)
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Geolocation Microservice is listening to NATS ');
}
bootstrap();
