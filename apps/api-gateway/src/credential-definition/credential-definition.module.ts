import { ClientsModule, Transport } from '@nestjs/microservices';
import { DynamicModule, Module, Provider } from '@nestjs/common';

import { CredentialDefinitionController } from './credential-definition.controller';
import { CredentialDefinitionService } from './credential-definition.service';
import { getNatsOptions } from '@credebl/common';
import { CommonConstants } from '@credebl/common';
import { NATSClient } from '@credebl/common';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CREDENTIAL_DEFINITION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
      }
    ])
  ],
  controllers: [CredentialDefinitionController],
  providers: [CredentialDefinitionService, NATSClient]
})
export class CredentialDefinitionModule {
  static register(
    overrides: Provider[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controllerOverrides: any[] = [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importedModules: any[] = []
  ): DynamicModule {
    return {
      module: CredentialDefinitionModule,
      imports: [
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options: getNatsOptions(CommonConstants.CREDENTIAL_DEFINITION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)
          }
        ]),
        ...importedModules
      ],
      controllers: controllerOverrides.length ? controllerOverrides : [CredentialDefinitionController],
      providers: [CredentialDefinitionService, NATSClient, ...overrides]
    };
  }
}
