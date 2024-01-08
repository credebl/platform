import { ResponseMessages } from '@credebl/common/response-messages';
import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { INotification, IHolderRegisterCredentals, IWebhookEndpoint } from '../interfaces/notification.interfaces';

@Injectable()
export class NotificationRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }


    /**
     * Register organization webhook endpoint
     * @param payload 
     * @returns Stored notification data
     */
    async storeOrgWebhookEndpoint(payload: IWebhookEndpoint): Promise<INotification> {
        try {

            const { orgId, webhookEndpoint } = payload;
            const updateNotification = await this.prisma.notification.create({
                data: {
                    orgId,
                    webhookEndpoint
                }
            });

            if (!updateNotification) {
                throw new NotFoundException(ResponseMessages.notification.error.notFound);
            }

            return updateNotification;
        } catch (error) {
            this.logger.error(`Error in storeOrgWebhookEndpoint: ${error.message} `);
            throw error;
        }
    }

    /**
     * Update the holder specific fcmtoken, userkey by orgId 
     * @param registerHolder 
     * @param res 
     * @returns Updated notification data
     */
    async updateHolderRegisterCredentials(payload: IHolderRegisterCredentals): Promise<INotification> {
        try {
            const { fcmToken, orgId, userKey } = payload;
            const updateNotification = await this.prisma.notification.update({
                where: {
                    orgId
                },
                data: {
                    fcmToken,
                    userKey
                }
            });

            if (!updateNotification) {
                throw new NotFoundException(ResponseMessages.notification.error.notFound);
            }

            return updateNotification;
        } catch (error) {
            this.logger.error(`Error in updateHolderRegisterCredentials: ${error.message} `);
            throw error;
        }
    }
}