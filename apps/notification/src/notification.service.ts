import { Injectable, Logger } from '@nestjs/common';
import { INotification, IHolderRegisterCredentals, IWebhookEndpoint } from '../interfaces/notification.interfaces';
import { RpcException } from '@nestjs/microservices';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) { }

  /**
   * Register organization webhook endpoint
   * @param payload 
   * @returns Stored notification data
   */
  async registerOrgWebhookEndpoint(payload: IWebhookEndpoint): Promise<INotification> {
    try {

      /**
       * Call the function for store the org webhook endpoint on notification table
       */
      const storeOrgWebhookEndpoint = await this.notificationRepository.storeOrgWebhookEndpoint(payload);
      return storeOrgWebhookEndpoint;
    } catch (error) {
      this.logger.error(`[registerEndpoint] - error in register org webhook endpoint: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
     * Update the holder specific fcmtoken, userkey by orgId 
     * @param registerHolder 
     * @param res 
     * @returns Updated notification data
     */
  async registerHolderCredentals(payload: IHolderRegisterCredentals): Promise<INotification> {
    try {

      /**
       * Call the function for update the token and passkey on notification table
       */
      const updateNotification = await this.notificationRepository.updateHolderRegisterCredentials(payload);
      return updateNotification;
    } catch (error) {
      this.logger.error(`[registerEndpoint] - error in register endpoint for holder: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
