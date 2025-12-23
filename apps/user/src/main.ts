import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { UserModule } from './user.module';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.USER_SERVICE, process.env.USER_NKEY_SEED)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('User Microservice is listening to NATS ');
  const supportedProviders = ['sendgrid', 'resend', 'smtp'] as const;
  type EmailProvider = (typeof supportedProviders)[number];
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (!provider) {
    Logger.warn(
      `Email service is disabled because EMAIL_PROVIDER is not set. ` +
        `Configure EMAIL_PROVIDER (sendgrid, resend, or smtp) to enable sending emails.`
    );
  } else if (!supportedProviders.includes(provider as EmailProvider)) {
    Logger.warn(
      `Unknown EMAIL_PROVIDER value "${process.env.EMAIL_PROVIDER}". ` +
        `Supported providers are: sendgrid, resend, smtp. ` +
        `Email service will be disabled.`
    );
  } else {
    const Emailprovider = provider as EmailProvider;
    logger.log(`Email provider configured: ${Emailprovider}`);
  }
}
bootstrap();
