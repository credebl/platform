import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ClientsModule } from '@nestjs/microservices';
import { CommonModule } from '../../../../libs/common/src/common.module';
import { CommonService } from '../../../../libs/common/src/common.service';
import { ConfigModule } from '@nestjs/config';
import { commonNatsOptions } from 'libs/service/nats.options';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        ...commonNatsOptions('AGENT_SERVICE:REQUESTER')
      },
      CommonModule
    ])
  ],
  controllers: [AgentController],
  providers: [AgentService, CommonService]
})
export class AgentModule { }
