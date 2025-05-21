import { CommonModule } from '@credebl/common'
import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module'
import { GlobalConfigModule } from '@credebl/config/global-config.module'
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule'
import { LoggerModule } from '@credebl/logger/logger.module'
import { PrismaService } from '@credebl/prisma-service'
import { CacheModule } from '@nestjs/cache-manager'
import { Logger, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CloudWalletController } from './cloud-wallet.controller'
import { CloudWalletRepository } from './cloud-wallet.repository'
import { CloudWalletService } from './cloud-wallet.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.CLOUD_WALLET_NKEY_SEED),
      },
    ]),

    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register(),
  ],
  controllers: [CloudWalletController],
  providers: [
    CloudWalletService,
    CloudWalletRepository,
    PrismaService,
    Logger,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'cloud-wallet',
    },
  ],
})
export class CloudWalletModule {}
