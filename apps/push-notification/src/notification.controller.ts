import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { ConnectionNotificationPayload, UserRequest } from './interfaces/notification.interfaces';

@Controller()
@ApiTags('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  /**
   * Description: Create out-of-band connection legacy invitation
   * @param payload 
   * @returns Created connection invitation for out-of-band
   */
  @MessagePattern({ cmd: 'connection-notification' })
  async saveConnectionNotification(payload: ConnectionNotificationPayload): Promise<object> {
    return this.notificationService.saveConnectionNotification(payload);
  }

  @MessagePattern({ cmd: 'get-all-notifications' })
  async connectionEmitter(payload: UserRequest): Promise<object> {
    return this.notificationService.getAllNotifications(payload);
  }

}
