import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '../../../libs/service/base.service';

@Injectable()
export class AppService extends BaseService {
    constructor(
        @Inject('NATS_CLIENT') private readonly appServiceProxy: ClientProxy
    ) {
        super('appService');
    }
}
