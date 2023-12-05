import { getNatsOptions } from '@credebl/common/nats.config';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [

        ClientsModule.register([
            {
                name: 'NATS_CLIENT',
                transport: Transport.NATS,
                options: getNatsOptions(process.env.API_GATEWAY_NKEY_SEED)
              }
        ])
    ],
    controllers: [ConnectionController],
    providers: [ConnectionService]
})

export class ConnectionModule {
}