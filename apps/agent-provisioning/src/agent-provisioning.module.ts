import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { AgentProvisioningController } from './agent-provisioning.controller';
import { AgentProvisioningService } from './agent-provisioning.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants, MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/common/utils/context/contextInterceptorModule';
import { ConfigModule as PlatformConfig } from '@credebl/config';

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
        options: getNatsOptions(
          CommonConstants.AGENT_PROVISIONING,
          process.env.AGENT_PROVISIONING_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
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
  ],
  exports: [AgentProvisioningService]
})
export class AgentProvisioningModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: AgentProvisioningModule,
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
            options: getNatsOptions(
              CommonConstants.AGENT_PROVISIONING,
              process.env.AGENT_PROVISIONING_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [AgentProvisioningController],
      providers: [
        AgentProvisioningService,
        Logger,
        {
          provide: MICRO_SERVICE_NAME,
          useValue: 'Agent-provisioning'
        },
        ...overrides
      ],
      exports: [AgentProvisioningService]
    };
  }
}
