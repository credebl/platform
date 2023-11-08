import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OrganizationModule } from './organization.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import { nkeyAuthenticator } from 'nats';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(OrganizationModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.ORGANIZATION_NKEY_SEED)

  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Organization Microservice is listening to NATS ');
}
bootstrap();
