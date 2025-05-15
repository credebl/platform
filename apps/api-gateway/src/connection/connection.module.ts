import { NATSClient } from '@credebl/common/NATSClient'
import { CommonConstants } from '@credebl/common/common.constant'
import { getNatsOptions } from '@credebl/common/nats.config'
import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConnectionController } from './connection.controller'
import { ConnectionService } from './connection.service'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.API_GATEWAY_NKEY_SEED),
      },
    ]),
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService, NATSClient],
})
export class ConnectionModule {}
