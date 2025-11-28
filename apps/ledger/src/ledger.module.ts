import { Logger, Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { SchemaModule } from './schema/schema.module';
import { PrismaServiceModule } from '@credebl/prisma-service';
import { CredentialDefinitionModule } from './credential-definition/credential-definition.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LedgerRepository } from './repositories/ledger.repository';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';

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
        options: getNatsOptions(CommonConstants.LEDGER_SERVICE, process.env.LEDGER_NKEY_SEED)
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
