import { ClientsModule, Transport } from '@nestjs/microservices';

import { CommonConstants } from '@credebl/common/common.constant';
import { FidoController } from './fido.controller';
import { FidoService } from './fido.service';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.FIDO_SERVICE, process.env.NATS_CREDS_FILE)
      }
    ])
  ],
  controllers: [FidoController],
  providers: [FidoService, NATSClient]
})
export class FidoModule {}
