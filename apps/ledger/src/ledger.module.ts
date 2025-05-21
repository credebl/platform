import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module'
import { LedgerController } from './ledger.controller'
import { LedgerService } from './ledger.service'
import { LedgerRepository } from './repositories/ledger.repository'
import { SchemaModule } from './schema/schema.module'

@Module({
  imports: [
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.LEDGER_SERVICE, process.env.LEDGER_NKEY_SEED),
      },
    ]),
    SchemaModule,
    CredentialDefinitionModule,
  ],
  controllers: [LedgerController],
  providers: [LedgerService, PrismaService, LedgerRepository, Logger],
})
export class LedgerModule {}
