import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentController } from './agent.controller';
import { AgentServiceService } from './agent.service';
import { ClientsModule } from '@nestjs/microservices';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { CommonService } from '@credebl/common/common.service';
import { ConfigModule } from '@nestjs/config';
import { commonNatsOptions } from '@credebl/common/nats.options';
import { NATSClient } from '@credebl/common/NATSClient';

@Module({})
export class AgentModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: AgentModule,
      imports: [
        HttpModule,
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            ...commonNatsOptions('AGENT_SERVICE:REQUESTER')
          },
          GlobalConfigModule
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [AgentController],
      providers: [AgentServiceService, CommonService, NATSClient, ...overrides]
    };
  }
}
