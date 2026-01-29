import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AgentProvisioningModule } from './agent-provisioning.module';
import { CommonConstants } from '@credebl/common/common.constant';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';
import { getNatsOptions } from '@credebl/common/nats.config';

const logger = new Logger();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AgentProvisioningModule, {
    transport: Transport.NATS,
    options: getNatsOptions(CommonConstants.AGENT_PROVISIONING, process.env.NATS_CREDS_FILE)
  });
  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Agent-Provisioning-Service Microservice is listening to NATS ');
}
bootstrap();
