import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { INotification, IHolderRegisterCredentals, IWebhookEndpoint, ISendNotification } from '../interfaces/notification.interfaces';
import { RpcException } from '@nestjs/microservices';
import { NotificationRepository } from './notification.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CommonService } from '@credebl/common';


@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  constructor(
    private readonly commonService: CommonService,
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
   * Send notification for holder
   * @param payload 
   * @returns Get notification details
   */
  async sendNotification(payload: ISendNotification): Promise<object> {
    try {
      const orgId = payload?.clientCode;
      const getWebhookUrl = await this.notificationRepository.getOrgWebhookEndpoint(orgId);

      const webhookPayload = {
        fcmToken: payload.fcmToken,
        '@type': payload['@type']
      };

      const webhookResponse = await this.commonService.httpPost(getWebhookUrl?.webhookEndpoint, webhookPayload)
        .then(async response => response)
        .catch(error => {
          this.logger.error(`Error in sendNotification : ${JSON.stringify(error)}`);
          throw error;
        });

      if (!this.isValidUrl(getWebhookUrl?.webhookEndpoint)) {
        throw new BadRequestException(ResponseMessages.notification.error.invalidUrl);
      }

      return webhookResponse;

    } catch (error) {
      this.logger.error(`[registerEndpoint] - error in send notification: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  private isValidUrl(url: string): boolean {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    return urlRegex.test(url);
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
