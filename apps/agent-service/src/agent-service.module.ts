import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { CommonModule, NatsInterceptor } from '@credebl/common';
import { Logger, Module } from '@nestjs/common';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { AgentServiceController } from './agent-service.controller';
import { AgentServiceRepository } from './repositories/agent-service.repository';
import { AgentServiceService } from './agent-service.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { ConnectionRepository } from 'apps/connection/src/connection.repository';
import { ConnectionService } from 'apps/connection/src/connection.service';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { getNatsOptions } from '@credebl/common/nats.config';

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
        options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.NATS_CREDS_FILE)
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
    ConnectionRepository,
    UserActivityRepository,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'Agent-service'
    },
    NATSClient,
    {
      provide: APP_INTERCEPTOR,
      useClass: NatsInterceptor
    }
  ],
  exports: [AgentServiceService, AgentServiceRepository, AgentServiceModule]
})
export class AgentServiceModule {}
