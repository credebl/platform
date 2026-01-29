import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule, CommonService } from '@credebl/common';

import { CommonConstants } from '@credebl/common/common.constant';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { NATSClient } from '@credebl/common/NATSClient';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { getNatsOptions } from '@credebl/common/nats.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: getNatsOptions(CommonConstants.NOTIFICATION_SERVICE, process.env.NATS_CREDS_FILE)
      },
      CommonModule
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService, CommonService, NATSClient]
})
export class NotificationModule {}
