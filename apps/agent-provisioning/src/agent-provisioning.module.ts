import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { Logger, Module } from '@nestjs/common';

import { AgentProvisioningController } from './agent-provisioning.controller';
import { AgentProvisioningService } from './agent-provisioning.service';
import { ConfigModule } from '@nestjs/config';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
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
        options: getNatsOptions(CommonConstants.AGENT_PROVISIONING, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [AgentProvisioningController],
  providers: [
    AgentProvisioningService,
    Logger,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'Agent-provisioning'
    }
  ]
})
export class AgentProvisioningModule {}
