import { ResponseMessages } from '@credebl/common/response-messages';
import { PrismaService } from '@credebl/prisma-service';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationStatus } from '@credebl/enum/enum';
import {
  ICreateHolderNotification,
  IHolderNotification
} from '@credebl/common/interfaces/holder-notification.interfaces';

@Injectable()
export class HolderNotificationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   * Register holder for notification
   * @param payload
   * @returns Stored notification data
   */
  async registerHolderNotification(payload: ICreateHolderNotification): Promise<IHolderNotification> {
    try {
      const holderNotification = await this.prisma.holder_notification.findUnique({
        where: {
          sessionId: payload.sessionId
        }
      });

      if (holderNotification) {
        throw new ConflictException(ResponseMessages.holderNotification.error.conflict);
      }

      const createNotification = await this.prisma.holder_notification.create({
        data: {
          sessionId: payload.sessionId,
          holderDid: payload.holderDid,
          fcmToken: payload.fcmToken,
          state: payload.state
        }
      });

      return createNotification;
    } catch (error) {
      this.logger.error(`Error in registerHolderNotification: ${error.message} `);
      throw error;
    }
  }

  async updateHolderNotificationState(sessionId: string, state: NotificationStatus): Promise<IHolderNotification> {
    try {
      const updateNotification = await this.prisma.holder_notification.update({
        where: {
          sessionId
        },
        data: {
          state
        }
      });

      if (!updateNotification) {
        throw new NotFoundException(ResponseMessages.holderNotification.error.notFound);
      }

      return this.getHolderNotificationBySessionId(sessionId);
    } catch (error) {
      this.logger.error(`Error in updateHolderNotificationState: ${error.message} `);
      throw error;
    }
  }

  /**
   * Get holder notification by sessionId
   * @param sessionId
   * @returns Get notification details
   */
  async getHolderNotificationBySessionId(sessionId: string): Promise<IHolderNotification> {
    try {
      const holderNotification = await this.prisma.holder_notification.findUnique({
        where: {
          sessionId
        }
      });

      if (!holderNotification) {
        throw new NotFoundException(ResponseMessages.holderNotification.error.notFound);
      }

      return holderNotification;
    } catch (error) {
      this.logger.error(`Error in getHolderNotificationBySessionId: ${error.message} `);
      throw error;
    }
  }
}
