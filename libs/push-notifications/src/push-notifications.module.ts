import { Module } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';

@Module({
  providers: [PushNotificationsService],
  exports: [PushNotificationsService]
})
export class PushNotificationsModule {}
