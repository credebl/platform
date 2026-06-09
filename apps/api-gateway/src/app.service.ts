import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from '@credebl/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly appServiceProxy: ClientProxy) {
    super('appService');
  }
}
