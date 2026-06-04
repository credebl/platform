import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Oid4vcVerificationService } from './oid4vc-verification.service';
import { Oid4vcVerificationController } from './oid4vc-verification.controller';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@credebl/logger';

@Module({})
export class Oid4vpModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: Oid4vpModule,
      imports: [
        HttpModule,
        LoggerModule,
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(
              CommonConstants.OIDC4VC_VERIFICATION_SERVICE,
              process.env.API_GATEWAY_NKEY_SEED,
              process.env.NATS_CREDS_FILE
            )
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [Oid4vcVerificationController],
      providers: [Oid4vcVerificationService, NATSClient, ...overrides]
    };
  }
}
