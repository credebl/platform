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
                options: {
                  servers: [`${process.env.NATS_URL}`]
                }
              }
        ])
    ],
    controllers: [ConnectionController],
    providers: [ConnectionService]
})

export class ConnectionModule {
}