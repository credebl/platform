import { NATSClient } from '@credebl/common/NATSClient'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule } from '@nestjs/microservices'
import { commonNatsOptions } from 'libs/service/nats.options'
import { CommonModule } from '../../../../libs/common/src/common.module'
import { CommonService } from '../../../../libs/common/src/common.service'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('AGENT_SERVICE:REQUESTER'),
      },
      CommonModule,
    ]),
  ],
  controllers: [AgentController],
  providers: [AgentService, CommonService, NATSClient],
})
export class AgentModule {}
