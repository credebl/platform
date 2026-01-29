import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context';
import { GlobalConfigModule } from '@credebl/config';
import { LoggerModule } from '@credebl/logger';
import { NATSClient } from '@credebl/common/NATSClient';
import { Oid4vcIssuanceController } from './oid4vc-issuance.controller';
import { Oid4vcIssuanceRepository } from './oid4vc-issuance.repository';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.OIDC4VC_ISSUANCE_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [Oid4vcIssuanceController],
  providers: [Oid4vcIssuanceService, Oid4vcIssuanceRepository, PrismaService, Logger, NATSClient]
})
export class Oid4vcIssuanceModule {}
