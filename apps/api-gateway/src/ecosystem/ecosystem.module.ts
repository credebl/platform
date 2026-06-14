import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
// import { EcosystemModule as EcosystemServiceModule } from 'apps/ecosystem/src/ecosystem.module';
import { IntentController } from './intent/intent.controller';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({})
export class EcosystemModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: EcosystemModule,
      imports: [
        // EcosystemServiceModule,
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.ECOSYSTEM_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [EcosystemController, IntentController],
      providers: [EcosystemService, NATSClient, ...overrides],
      exports: [EcosystemService]
    };
  }
}
