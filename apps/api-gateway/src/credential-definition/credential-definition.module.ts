import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { CredentialDefinitionController } from './credential-definition.controller';
import { CredentialDefinitionService } from './credential-definition.service';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CREDENTIAL_DEFINITION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [CredentialDefinitionController],
  providers: [CredentialDefinitionService, NATSClient]
})
export class CredentialDefinitionModule {
  constructor() {
    Logger.log('API Gateway - CredDef loaded...');
  }
}
