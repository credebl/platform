import { Logger, Module } from '@nestjs/common';
import { AgentProvisioningController } from './agent-provisioning.controller';
import { AgentProvisioningService } from './agent-provisioning.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
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
        options: getNatsOptions(CommonConstants.AGENT_PROVISIONING, process.env.AGENT_PROVISIONING_NKEY_SEED)
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
