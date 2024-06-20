import { Logger, Module } from '@nestjs/common';
import { AgentProvisioningController } from './agent-provisioning.controller';
import { AgentProvisioningService } from './agent-provisioning.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.AGENT_PROVISIONING_NKEY_SEED, CommonConstants.AGENT_PROVISIONING)
        
      }
    ])
  ],
  controllers: [AgentProvisioningController],
  providers: [AgentProvisioningService, Logger]
})
export class AgentProvisioningModule { }
