import { HttpExceptionFilter } from 'libs/http-exception.filter';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AgentServiceModule } from './agent-service.module';
import { AgentServiceService } from './agent-service.service';
import { IAgentSpinupDto, IUserRequestInterface } from './interface/agent-service.interface';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CommonConstants } from '@credebl/common/common.constant';
import { Ledgers } from '@credebl/enum/enum';

const logger = new Logger();

async function bootstrap(): Promise<void> {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AgentServiceModule, {
    transport: Transport.NATS,
    options: {
      servers: [`${process.env.NATS_URL}`]
    }
  });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen();
  logger.log('Agent-Service Microservice is listening to NATS ');

  let user: IUserRequestInterface;

  const agentSpinupPayload: IAgentSpinupDto = {
    walletName: process.env.PLATFORM_WALLET_NAME,
    walletPassword: process.env.PLATFORM_WALLET_PASSWORD,
    seed: process.env.PLATFORM_SEED,
    orgName: `${CommonConstants.PLATFORM_ADMIN_ORG}`,
    tenant: true,
    ledgerName: [Ledgers.Bcovrin_Testnet, Ledgers.Indicio_Demonet, Ledgers.Indicio_Mainnet, Ledgers.Indicio_Testnet]
  };

  const agentService = app.get(AgentServiceService);
  await agentService.walletProvision(agentSpinupPayload, user)
    .catch((error) => {
      logger.error(error?.error?.response?.message);
    });
}
bootstrap();