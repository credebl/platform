import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
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
    controllers: [NotificationController],
    providers: [NotificationService, EventEmitter2]
})

export class NotificationModule {
}