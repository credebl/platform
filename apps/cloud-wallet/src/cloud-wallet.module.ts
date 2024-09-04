import { Logger, Module } from '@nestjs/common';
import { CloudWalletController } from './cloud-wallet.controller';
import { CloudWalletService } from './cloud-wallet.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { CacheModule } from '@nestjs/cache-manager';
import { getNatsOptions } from '@credebl/common/nats.config';
import { PrismaService } from '@credebl/prisma-service';
import { CloudWalletRepository } from './cloud-wallet.repository';

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
  CacheModule.register()
],
  controllers: [CloudWalletController],
  providers: [CloudWalletService, CloudWalletRepository, PrismaService, Logger]
})
export class CloudWalletModule {}
