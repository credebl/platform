import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemRepository } from '../repositories/ecosystem.repository';
import { EcosystemService } from './ecosystem.service';
import { GlobalConfigModule } from '@credebl/config';
import { LoggerModule } from '@credebl/logger/logger.module';
import { NATSClient } from '@credebl/common/NATSClient';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.ECOSYSTEM_SERVICE, process.env.ECOSYSTEM_NKEY_SEED)
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, EcosystemRepository, PrismaService, Logger, NATSClient]
})
export class EcosystemModule {}
