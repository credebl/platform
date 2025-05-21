import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CloudWalletController } from './cloud-wallet.controller'
import { CloudWalletService } from './cloud-wallet.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CLOUD_WALLET_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
    ]),
  ],
  controllers: [CloudWalletController],
  providers: [CloudWalletService, NATSClient],
})
export class CloudWalletModule {}
