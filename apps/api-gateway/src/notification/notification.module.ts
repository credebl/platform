
import { CommonModule, CommonService } from '@credebl/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { getNatsOptions } from '@credebl/common/nats.config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { CommonConstants } from '@credebl/common/common.constant';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.NOTIFICATION_SERVICE, process.env.API_GATEWAY_NKEY_SEED)

      },
      CommonModule
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService, CommonService]
})
export class NotificationModule { }
