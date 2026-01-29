import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.CONNECTION_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [ConnectionController],
  providers: [ConnectionService, NATSClient]
})
export class ConnectionModule {}
