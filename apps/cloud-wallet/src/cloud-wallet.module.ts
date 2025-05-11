import { Logger, Module } from '@nestjs/common';
import { CloudWalletController } from './cloud-wallet.controller';
import { CloudWalletService } from './cloud-wallet.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { PrismaService } from '@credebl/prisma-service';
import { CloudWalletRepository } from './cloud-wallet.repository';
import { GlobalConfigModule } from '@credebl/config/global-config.module';
import { LoggerModule } from '@credebl/logger/logger.module';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { ContextInterceptorModule } from '@credebl/context/contextInterceptorModule';
import { MICRO_SERVICE_NAME } from '@credebl/common/common.constant';

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
