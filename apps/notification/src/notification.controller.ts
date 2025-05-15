import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import type { INotification, ISendNotification, IWebhookEndpoint } from '../interfaces/notification.interfaces'
import type { NotificationService } from './notification.service'

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
    return this.notificationService.registerOrgWebhookEndpoint(payload)
  }

  /**
   * Send notification for holder
   * @param payload
   * @returns Get notification details
   */
  @MessagePattern({ cmd: 'send-notification' })
  async sendNotification(payload: ISendNotification): Promise<object> {
    return this.notificationService.sendNotification(payload)
  }
}
