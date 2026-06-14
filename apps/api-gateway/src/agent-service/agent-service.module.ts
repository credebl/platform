import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { CommonService } from '@credebl/common/common.service';
import { ConfigModule } from '@nestjs/config';
import { AgentServiceController } from './agent-service.controller';
import { AgentService } from './agent-service.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({})
export class AgentServiceModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: AgentServiceModule,
      imports: [
        HttpModule,
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.AGENT_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          },
          GlobalConfigModule
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [AgentServiceController],
      providers: [AgentService, CommonService, NATSClient, ...overrides]
    };
  }
}
