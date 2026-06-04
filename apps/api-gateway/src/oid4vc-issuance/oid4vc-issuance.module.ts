import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { Oid4vcIssuanceController } from './oid4vc-issuance.controller';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';

@Module({})
export class Oid4vcIssuanceModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: Oid4vcIssuanceModule,
      imports: [
        HttpModule,
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.ISSUANCE_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [Oid4vcIssuanceController],
      providers: [Oid4vcIssuanceService, NATSClient, ...overrides]
    };
  }
}
