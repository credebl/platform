import { Logger, Module } from '@nestjs/common';
import { EcosystemController } from './ecosystem.controller';
import { EcosystemService } from './ecosystem.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule} from '@credebl/common';
import { EcosystemRepository } from './ecosystem.repository';
import { PrismaService } from '@credebl/prisma-service';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { NATSClient } from 'libs/common/NATSClient';

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
    LoggerModule, PlatformConfig, ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [EcosystemController],
  providers: [EcosystemService, UserActivityRepository, PrismaService, Logger, EcosystemRepository, NATSClient]
})
export class EcosystemModule { }