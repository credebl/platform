import { Logger, Module } from '@nestjs/common';
import { Oid4vcIssuanceController } from './oid4vc-issuance.controller';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonModule } from '@credebl/common';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config';
import { ContextInterceptorModule } from '@credebl/context';
import { LoggerModule } from '@credebl/logger';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { Oid4vcIssuanceRepository } from './oid4vc-issuance.repository';
import { NATSClient } from '@credebl/common/NATSClient';
import { PrismaService } from '@credebl/prisma-service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.OIDC4VC_ISSUANCE_SERVICE, process.env.OIDC4VC_ISSUANCE_NKEY_SEED)
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
