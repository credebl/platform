import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../../../../libs/common/src/common.module';
import { CommonService } from '../../../../libs/common/src/common.service';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent-service.controller';
import { AgentService } from './agent-service.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.API_GATEWAY_NKEY_SEED)

      },
      CommonModule
    ])
  ],
  controllers: [AgentController],
  providers: [AgentService, CommonService]
})
export class AgentModule { }
