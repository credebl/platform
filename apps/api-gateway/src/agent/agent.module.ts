import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ClientsModule } from '@nestjs/microservices';
import { CommonModule } from '../../../../libs/common/src/common.module';
import { CommonService } from '../../../../libs/common/src/common.service';
import { ConfigModule } from '@nestjs/config';
import { commonNatsOptions } from 'libs/service/nats.options';
import { NATSClient } from '@credebl/common/NATSClient';
import { OrganizationModule } from '../organization/organization.module';
import { AuthzModule } from '../authz/authz.module';

@Module({
  imports: [
    AuthzModule,
    OrganizationModule,
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
  providers: [AgentService, CommonService, NATSClient],
  exports: [AgentService]
})
export class AgentModule { }
