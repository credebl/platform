import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

import { CommonModule } from '@credebl/common'
import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { PrismaService } from '@credebl/prisma-service'
import { HttpModule } from '@nestjs/axios'
import { CacheModule } from '@nestjs/cache-manager'
import { CredentialDefinitionController } from './credential-definition.controller'
import { CredentialDefinitionService } from './credential-definition.service'
import { CredentialDefinitionRepository } from './repositories/credential-definition.repository'
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.CREDENTIAL_DEFINITION_SERVICE,
          process.env.CREDENTAILDEFINITION_NKEY_SEED
        ),
      },
    ]),
    HttpModule,
    CommonModule,
    CacheModule.register(),
  ],
  providers: [CredentialDefinitionService, CredentialDefinitionRepository, Logger, PrismaService, NATSClient],
  controllers: [CredentialDefinitionController],
})
export class CredentialDefinitionModule {}
