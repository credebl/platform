import { ResponseMessages } from '@credebl/common/response-messages';
import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { INotification, IWebhookEndpoint } from '../interfaces/notification.interfaces';

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
     * Get webhook endpoint
     * @param orgId 
     * @returns Get notification details
     */
    async getOrgWebhookEndpoint(orgId: string): Promise<INotification> {
        try {

            const updateNotification = await this.prisma.notification.findUnique({
                where: {
                    orgId
                }
            });

            if (!updateNotification) {
                throw new NotFoundException(ResponseMessages.notification.error.notFound);
            }

            return updateNotification;
        } catch (error) {
            this.logger.error(`Error in getOrgWebhookEndpoint: ${error.message} `);
            throw error;
        }
    }
}