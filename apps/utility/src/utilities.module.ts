import { Logger, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonModule } from '@credebl/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaService } from '@credebl/prisma-service';
import { UtilitiesController } from './utilities.controller';
import { UtilitiesService } from './utilities.service';
import { UtilitiesRepository } from './utilities.repository';
import { AwsService } from '@credebl/aws';
import { CommonConstants } from '@credebl/common/common.constant';
import { GlobalConfigModule } from '@credebl/common/global-config.module';
import { ConfigModule as PlatformConfig } from '@credebl/config';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ContextInterceptorModule } from '@credebl/common/utils/context/contextInterceptorModule';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(
          CommonConstants.UTILITY_SERVICE,
          process.env.UTILITIES_NKEY_SEED,
          process.env.NATS_CREDS_FILE
        )
      }
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService, Logger, PrismaService, UtilitiesRepository, AwsService]
})
export class UtilitiesModule {}
