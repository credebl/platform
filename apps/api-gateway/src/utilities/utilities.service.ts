import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { UtilitiesDto } from './dtos/shortening-url.dto';

@Injectable()
export class UtilitiesService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('OrganizationService');
  }

  async createShorteningUrl(shorteningUrlDto: UtilitiesDto): Promise<string> {
    return this.sendNatsMessage(this.serviceProxy, 'create-shortening-url', shorteningUrlDto);
  }

  async storeObject(persistent: boolean, storeObj: UtilitiesDto): Promise<string> {
    const payload = {persistent, storeObj};
    return this.sendNatsMessage(this.serviceProxy, 'store-object', payload);
  }
}
