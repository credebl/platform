import { ClientsModule, Transport } from '@nestjs/microservices';

import { CloudWalletController } from './cloud-wallet.controller';
import { CloudWalletService } from './cloud-wallet.service';
import { CommonConstants } from '@credebl/common/common.constant';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CLOUD_WALLET_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [CloudWalletController],
  providers: [CloudWalletService, NATSClient]
})
export class CloudWalletModule {}
