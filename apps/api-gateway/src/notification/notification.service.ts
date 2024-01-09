import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { RegisterHolderCredentalsDto, RegisterOrgWebhhookEndpointDto, SendNotificationDto } from './dtos/notification.dto';
import { INotification } from './interfaces/notification.interfaces';

@Injectable()
export class NoificatonService extends BaseService {
    constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
        super('noificatonService');
    }

    /**
     * Register organization webhook endpoint
     * @param registerOrgWebhhookEndpointDto 
     * @returns Stored notification data
     */
    async registerOrgWebhookEndpoint(registerOrgWebhhookEndpointDto: RegisterOrgWebhhookEndpointDto): Promise<INotification> {
        return this.sendNatsMessage(this.serviceProxy, 'register-org-webhook-endpoint-for-notification', registerOrgWebhhookEndpointDto);
    }

    /**
     * Send notification for holder
     * @param sendNotificationDto 
     * @returns Get notification details
     */
    async sendNotification(sendNotificationDto: SendNotificationDto): Promise<INotification> {
        return this.sendNatsMessage(this.serviceProxy, 'send-notification', sendNotificationDto);
    }

    /**
     * Update the holder specific fcmtoken, userkey by orgId 
     * @param registerHolder 
     * @param res 
     * @returns Updated notification data
     */
    async registerHolderCredentals(registerHolder: RegisterHolderCredentalsDto): Promise<INotification> {
        return this.sendNatsMessage(this.serviceProxy, 'register-holder-for-notification', registerHolder);
    }
}