import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CredentialDefinitionController } from './credential-definition.controller';
import { CredentialDefinitionService } from './credential-definition.service';
// import { nkeyAuthenticator } from 'nats';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
          
        }
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
