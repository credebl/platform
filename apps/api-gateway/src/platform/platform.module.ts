import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { EcosystemModule as EcosystemServiceModule } from 'apps/ecosystem/src/ecosystem.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({})
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
        EcosystemServiceModule,
        ConfigModule.forRoot(),
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.PLATFORM_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [PlatformController],
      providers: [PlatformService, NATSClient, ...overrides],
      exports: [EcosystemServiceModule]
    };
  }
}
