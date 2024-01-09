import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { INotification, IHolderRegisterCredentals, IWebhookEndpoint, ISendNotification } from '../interfaces/notification.interfaces';

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
     * Update the holder specific fcmtoken, userkey by orgId 
     * @param registerHolder 
     * @param res 
     * @returns Updated notification data
     */
  @MessagePattern({ cmd: 'register-holder-for-notification' })
  async registerHolderCredentals(payload: IHolderRegisterCredentals): Promise<INotification> {
       return this.notificationService.registerHolderCredentals(payload);
  }
}
