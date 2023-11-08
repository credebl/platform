import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FidoController } from './fido.controller';
import { FidoService } from './fido.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports:[
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED)

      }
    ])
  ],
  controllers: [FidoController],
  providers: [FidoService]
})
export class FidoModule { }
