import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { INotification, IWebhookEndpoint, ISendNotification, IGetNotification } from '../interfaces/notification.interfaces';

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
   * Get notification by webhook
   * @param payload 
   * @returns Get notification details
   */
  @MessagePattern({ cmd: 'get-notification' })
  async getNotification(payload: IGetNotification): Promise<string> {
       return this.notificationService.getNotification(payload);
  }
}
