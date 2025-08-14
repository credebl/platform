import { Module, DynamicModule, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { AgentServiceController } from './agent-service.controller';
import { AgentServiceService } from './agent-service.service';
import { CommonModule, CommonService, getNatsOptions } from '@credebl/common';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      },
      CommonModule
    ])
  ],
  controllers: [AgentServiceController],
  providers: [AgentServiceService, CommonService, NATSClient]
})
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
            options: getNatsOptions(CommonConstants.AGENT_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          },
          CommonModule
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [AgentServiceController],
      providers: [AgentServiceService, CommonService, NATSClient, ...overrides]
    };
  }
}
