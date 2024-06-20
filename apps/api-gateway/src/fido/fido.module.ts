import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FidoController } from './fido.controller';
import { FidoService } from './fido.service';
import { getNatsOptions } from '@credebl/common/nats.config';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED, CommonConstants.FIDO_SERVICE)

      }
    ])
  ],
  controllers: [FidoController],
  providers: [FidoService]
})
export class FidoModule { }
