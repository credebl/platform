import { NestFactory } from '@nestjs/core';
import { EcosystemModule } from './ecosystem.module';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(EcosystemModule, {
    transport: Transport.NATS,
    options: {
      servers: [`${process.env.NATS_URL}`]
    }
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Ecosystem microservice is listening to NATS ');
}
bootstrap();
