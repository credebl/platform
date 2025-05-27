import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { CacheModule } from '@nestjs/cache-manager'
import { Logger, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConnectionRepository } from 'apps/connection/src/connection.repository'
import { ConnectionService } from 'apps/connection/src/connection.service'
import { UserActivityRepository } from 'libs/user-activity/repositories'
import { AgentServiceController } from './agent-service.controller'
import { AgentServiceService } from './agent-service.service'
import { AgentServiceRepository } from './repositories/agent-service.repository'

@Module({
  imports: [
    ConfigModule.forRoot(),
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.AGENT_SERVICE_NKEY_SEED),
      },
    ]),
    CommonModule,
    CacheModule.register(),
  ],
  controllers: [AgentServiceController],
  providers: [
    AgentServiceService,
    AgentServiceRepository,
    PrismaService,
    Logger,
    ConnectionService,
    ConnectionRepository,
    UserActivityRepository,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'Agent-service',
    },
    NATSClient,
  ],
  exports: [AgentServiceService, AgentServiceRepository, AgentServiceModule],
})
export class AgentServiceModule {}
