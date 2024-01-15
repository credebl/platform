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
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.AGENT_SERVICE_NKEY_SEED)
      }
    ]),
    CommonModule,
    CacheModule.register()
  ],
  controllers: [AgentServiceController],
  providers: [
    AgentServiceService,
    AgentServiceRepository,
    PrismaService,
    Logger,
    ConnectionService,
    ConnectionRepository
  ],
  exports: [AgentServiceService, AgentServiceRepository, AgentServiceModule]
})
export class AgentServiceModule {}
