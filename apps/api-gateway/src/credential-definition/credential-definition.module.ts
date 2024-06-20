import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CredentialDefinitionController } from './credential-definition.controller';
import { CredentialDefinitionService } from './credential-definition.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.CREDENTIAL_DEFINITION_SERVICE)
      }
    ])
  ],
  controllers: [CredentialDefinitionController],
  providers: [CredentialDefinitionService]
})
export class CredentialDefinitionModule {
  constructor() {
    Logger.log('API Gateway - CredDef loaded...');

  }
}
