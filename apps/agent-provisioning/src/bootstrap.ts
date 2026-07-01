import { NestFactory } from '@nestjs/core';
import { Logger, Provider } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AgentProvisioningModule } from './agent-provisioning.module';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import NestjsLoggerServiceAdapter from '@credebl/logger/nestjsLoggerServiceAdapter';

const logger = new Logger();

export async function bootstrapAgentProvisioningService(
  overrides: Provider[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllerOverrides: any[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedModules: any[] = []
): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AgentProvisioningModule.register(overrides, controllerOverrides, importedModules),
    {
      transport: Transport.NATS,
      options: getNatsOptions(
        CommonConstants.AGENT_PROVISIONING,
        process.env.AGENT_PROVISIONING_NKEY_SEED,
        process.env.NATS_CREDS_FILE
      )
    }
  );

  app.useLogger(app.get(NestjsLoggerServiceAdapter));
  await app.listen();
  logger.log('Agent-Provisioning-Service Microservice is listening to NATS');
}
