import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AgentProvisioningModule } from './agent-provisioning.module';
import { getNatsOptions } from '@credebl/common/nats.config';
const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AgentProvisioningModule, {
    transport: Transport.NATS,
    options: getNatsOptions(process.env.AGENT_PROVISIONING_NKEY_SEED)
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Agent-Provisioning-Service Microservice is listening to NATS ');
}
bootstrap();
