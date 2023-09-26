import { Logger, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@credebl/common';
import { NotificationRepository } from './notification.repository';
import { PrismaService } from '@credebl/prisma-service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: {
          servers: [`${process.env.NATS_URL}`]
        }
      }
    ]),

    CommonModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, PrismaService, Logger]
})
export class NotificationModule { }
