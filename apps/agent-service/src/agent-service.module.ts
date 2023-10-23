import { CommonModule } from '@credebl/common';
import { PrismaService } from '@credebl/prisma-service';
import { Logger, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AgentServiceController } from './agent-service.controller';
import { AgentServiceService } from './agent-service.service';
import { AgentServiceRepository } from './repositories/agent-service.repository';
import { ConfigModule } from '@nestjs/config';
import { ConnectionService } from 'apps/connection/src/connection.service';
import { ConnectionRepository } from 'apps/connection/src/connection.repository';
// import { nkeyAuthenticator } from 'nats';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
          // authenticator: nkeyAuthenticator(new TextEncoder().encode(process.env.AGENT_SERVICE_NKEY_SEED)),
        }
      }
    ]),
    CommonModule
  ],
  controllers: [AgentServiceController],
  providers: [AgentServiceService, AgentServiceRepository, PrismaService, Logger, ConnectionService, ConnectionRepository]
})
export class AgentServiceModule { }
