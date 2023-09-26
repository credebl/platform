import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { notifications } from '@prisma/client';
@Injectable()
export class NotificationRepository {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }

    /**
     * Description: Get getAgentEndPoint by orgId
     * @param orgId 
     * @returns Get getAgentEndPoint details
     */
    // eslint-disable-next-line camelcase
    async getAllNotificationsByUserId(userObject): Promise<notifications[]> {
        try {
            const { id } = userObject;
            const notificationList = await this.prisma.notifications.findMany({
                where: {
                    userId: id
                }
                
            });
            return notificationList;
        } catch (error) {
            this.logger.error(`Error in getting notification details: ${error.message} `);
            throw error;
        }
    }
    

    /**
       * Description: Save connection notification
       * @param connectionNotification
       */
    // eslint-disable-next-line camelcase
    async saveConnectionNotificationDetails(connectionNotification): Promise<object> {
        try {
            const saveConnectionNotification = await this.prisma.notifications.create({
                data: {
                    details: 'TEST',
                    createdBy: connectionNotification.connectionNotificationPayload.orgId,
                    userId: connectionNotification.connectionNotificationPayload.orgId,
                    orgId:connectionNotification.connectionNotificationPayload.orgId,
                    recordId: connectionNotification.connectionNotificationPayload.connectionId,
                    type: 'CONNECTION',
                    state:connectionNotification.connectionNotificationPayload.state
                }
            });
            return saveConnectionNotification;

        } catch (error) {
            this.logger.error(`Error in saveConnectionNotification: ${error.message} `);
            throw error;
        }
    }   
}