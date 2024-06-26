import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WebhookModule } from '../src/webhook.module';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(WebhookModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.ISSUANCE_NKEY_SEED)

  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Webhook-Service Microservice is listening to NATS ');
}
bootstrap();
