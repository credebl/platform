import { AwsService } from '@credebl/aws'
import { CommonModule } from '@credebl/common'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { CacheModule } from '@nestjs/cache-manager'
import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { UtilitiesController } from './utilities.controller'
import { UtilitiesRepository } from './utilities.repository'
import { UtilitiesService } from './utilities.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.UTILITY_SERVICE, process.env.UTILITIES_NKEY_SEED),
      },
    ]),
    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService, Logger, PrismaService, UtilitiesRepository, AwsService],
})
export class UtilitiesModule {}
