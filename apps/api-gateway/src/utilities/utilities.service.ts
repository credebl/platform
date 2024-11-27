import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto';
import { NATSClient } from '@credebl/common/NATSClient';

@Injectable()
export class UtilitiesService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy, private readonly natsClient : NATSClient) {
    super('OrganizationService');
  }

  async createShorteningUrl(shorteningUrlDto: UtilitiesDto): Promise<string> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-shortening-url', shorteningUrlDto);
  }

  async storeObject(persistent: boolean, storeObjectDto: StoreObjectDto): Promise<string> {
    const storeObj = storeObjectDto.data;
    const payload = {persistent, storeObj};
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'store-object-return-url', payload);
  }
}
