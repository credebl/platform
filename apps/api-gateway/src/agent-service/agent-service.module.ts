import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '../../../../libs/common/src/common.module';
import { CommonService } from '../../../../libs/common/src/common.service';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from './agent-service.controller';
import { AgentService } from './agent-service.service';
// import { nkeyAuthenticator } from 'nats';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
          // authenticator: nkeyAuthenticator(new TextEncoder().encode(process.env.AGENT_SERVICE_NKEY_SEED)),
        }
      },
      CommonModule
    ])
  ],
  controllers: [AgentController],
  providers: [AgentService, CommonService]
})
export class AgentModule { }
