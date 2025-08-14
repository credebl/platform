import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { getNatsOptions } from '@credebl/common';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.PLATFORM_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [PlatformController],
  providers: [PlatformService, NATSClient]
})
export class PlatformModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: PlatformModule,
      imports: [
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.PLATFORM_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [PlatformController],
      providers: [PlatformService, ...overrides]
    };
  }
}
