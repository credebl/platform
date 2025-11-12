import { CommonModule, NatsInterceptor } from '@credebl/common';
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
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { NATSClient } from '@credebl/common/NATSClient';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
        options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.AGENT_SERVICE_NKEY_SEED)
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
