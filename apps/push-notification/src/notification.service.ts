/* eslint-disable camelcase */
import {
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  ClientProxy,
  RpcException
} from '@nestjs/microservices';
import { NotificationRepository } from './notification.repository';
import { ConnectionNotificationPayload, UserRequest } from './interfaces/notification.interfaces';


@Injectable()
export class NotificationService {

  constructor(
    @Inject('NATS_CLIENT') private readonly notificationServiceProxy: ClientProxy,
    private readonly notificationRepository: NotificationRepository,
    private readonly logger: Logger
  ) { }

  /**
   * Description: create connection legacy invitation 
   * @param orgId 
   * @param user 
   * @returns Connection legacy invitation URL
   */
  async saveConnectionNotification(payload:ConnectionNotificationPayload): Promise<object> {
    try {
      return this.notificationRepository.saveConnectionNotificationDetails(payload);
    } catch (error) {
      this.logger.error(`[saveConnectionNotification] - error in connection: ${error}`);
      throw new RpcException(error.response);
    }
  }

   /**
   * Description: create connection legacy invitation 
   * @param orgId 
   * @param user 
   * @returns Connection legacy invitation URL
   */
  async getAllNotifications(userObject:UserRequest): Promise<object> {
    try {
      return this.notificationRepository.getAllNotificationsByUserId(userObject);
    } catch (error) {
      this.logger.error(`[getAllConnectionNotifications] - error in get connection notification list: ${error}`);
      throw new RpcException(error.response);
    }
  }
}
