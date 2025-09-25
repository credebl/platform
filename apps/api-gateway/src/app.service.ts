import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from '../../../libs/service/base.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly appServiceProxy: ClientProxy) {
    super('appService');
  }
}
