import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IssuanceModule } from '../src/issuance.module';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(IssuanceModule, {
    transport: Transport.NATS,
    options: {
      servers: [`${process.env.NATS_URL}`]
    }
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Issuance-Service Microservice is listening to NATS ');
}
bootstrap();
