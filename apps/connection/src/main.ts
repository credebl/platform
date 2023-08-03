import { NestFactory } from '@nestjs/core';
import { ConnectionModule } from './connection.module';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ConnectionModule, {
    transport: Transport.NATS,
    options: {
      servers: [`${process.env.NATS_URL}`]
    }
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Connection-Service Microservice is listening to NATS ');
}
bootstrap();
