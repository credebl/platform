import { Logger, Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule} from '@credebl/common';
import { EcosystemRepository } from './ecosystem.repository';
import { PrismaService } from '@credebl/prisma-service';
import { AgentServiceService } from 'apps/agent-service/src/agent-service.service';
import { AgentServiceRepository } from 'apps/agent-service/src/repositories/agent-service.repository';
import { ConnectionService } from 'apps/connection/src/connection.service';
import { ConnectionRepository } from 'apps/connection/src/connection.repository';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.ECOSYSTEM_NKEY_SEED)
      }
    ]),

    CommonModule,
    CacheModule.register()
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, PrismaService, Logger, EcosystemRepository, AgentServiceService, AgentServiceRepository, ConnectionService, ConnectionRepository]
})
export class EcosystemModule { }
