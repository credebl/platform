import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy} from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';


@Injectable()
export class NotificationService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly notificationServiceProxy: ClientProxy
    ) {
        super('notificationService');
    }

    getAllNotification(user:IUserRequest): Promise<{
        response: object;
    }> {
        const payload = { user };
        return this.sendNats(this.notificationServiceProxy, 'get-all-notifications', payload);
    }

}