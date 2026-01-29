import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { CredentialDefinitionController } from './credential-definition.controller';
import { CredentialDefinitionRepository } from './repositories/credential-definition.repository';
import { CredentialDefinitionService } from './credential-definition.service';
import { HttpModule } from '@nestjs/axios';
import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CREDENTIAL_DEFINITION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    HttpModule,
    CommonModule,
    CacheModule.register()
  ],
  providers: [CredentialDefinitionService, CredentialDefinitionRepository, Logger, PrismaService, NATSClient],
  controllers: [CredentialDefinitionController]
})
export class CredentialDefinitionModule {}
