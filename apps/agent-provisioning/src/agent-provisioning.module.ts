import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { Logger, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AgentProvisioningController } from './agent-provisioning.controller'
import { AgentProvisioningService } from './agent-provisioning.service'
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
        options: getNatsOptions(CommonConstants.AGENT_PROVISIONING, process.env.AGENT_PROVISIONING_NKEY_SEED),
      },
    ]),
  ],
  controllers: [AgentProvisioningController],
  providers: [
    AgentProvisioningService,
    Logger,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'Agent-provisioning',
    },
  ],
})
export class AgentProvisioningModule {}
