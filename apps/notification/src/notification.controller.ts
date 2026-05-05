import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { INotification, IWebhookEndpoint, ISendNotification } from '../interfaces/notification.interfaces';
import {
  ICreateHolderNotification,
  IHolderNotification
} from '@credebl/common/interfaces/holder-notification.interfaces';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Register organization webhook endpoint
   * @param payload
   * @returns Stored notification data
   */
  @MessagePattern({ cmd: 'register-org-webhook-endpoint-for-notification' })
  async registerOrgWebhookEndpoint(payload: IWebhookEndpoint): Promise<INotification> {
    return this.notificationService.registerOrgWebhookEndpoint(payload);
  }

  /**
   * Send notification for holder
   * @param payload
   * @returns Get notification details
   */
  @MessagePattern({ cmd: 'send-notification' })
  async sendNotification(payload: ISendNotification): Promise<object> {
    return this.notificationService.sendNotification(payload);
  }

  /**
   * Register notification for holder
   * @param payload
   * @returns Get notification details
   */
  @MessagePattern({ cmd: 'register-holder-notification' })
  async registerHolderNotification(payload: ICreateHolderNotification): Promise<IHolderNotification> {
    return this.notificationService.registerHolderNotification(payload);
  }
}
