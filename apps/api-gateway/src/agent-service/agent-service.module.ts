import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CommonModule } from '../../../../libs/common/src/common.module'
import { CommonService } from '../../../../libs/common/src/common.service'
import { AgentController } from './agent-service.controller'
import { AgentService } from './agent-service.service'

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
      CommonModule,
    ]),
  ],
  controllers: [AgentController],
  providers: [AgentService, CommonService, NATSClient],
})
export class AgentModule {}
