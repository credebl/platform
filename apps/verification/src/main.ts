import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { VerificationModule } from './verification.module';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(VerificationModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.VERIFICATION_NKEY_SEED)

  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Verification-Service Microservice is listening to NATS ');
}
bootstrap();
