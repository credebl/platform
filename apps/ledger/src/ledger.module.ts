import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LedgerController } from './ledger.controller';
import { LedgerRepository } from './repositories/ledger.repository';
import { LedgerService } from './ledger.service';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaServiceModule } from '@credebl/prisma-service';
import { SchemaModule } from './schema/schema.module';
import { getNatsOptions } from '@credebl/common/nats.config';

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
        options: getNatsOptions(CommonConstants.LEDGER_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    SchemaModule,
    CredentialDefinitionModule,
    PrismaServiceModule
  ],
  controllers: [LedgerController],
  providers: [LedgerService, LedgerRepository, Logger]
})
export class LedgerModule {}
