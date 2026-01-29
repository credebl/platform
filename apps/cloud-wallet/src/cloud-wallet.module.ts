import { ClientsModule, Transport } from '@nestjs/microservices';
import { Logger, Module } from '@nestjs/common';

import { CacheModule } from '@nestjs/cache-manager';
import { CloudWalletController } from './cloud-wallet.controller';
import { CloudWalletRepository } from './cloud-wallet.repository';
import { CloudWalletService } from './cloud-wallet.service';
import { CommonModule } from '@credebl/common';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { PrismaService } from '@credebl/prisma-service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.CLOUD_WALLET_NKEY_SEED)
      }
    ]),

    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register()
  ],
  controllers: [CloudWalletController],
  providers: [
    CloudWalletService,
    CloudWalletRepository,
    PrismaService,
    Logger,
    {
      provide: MICRO_SERVICE_NAME,
      useValue: 'cloud-wallet'
    }
  ]
})
export class CloudWalletModule {}
