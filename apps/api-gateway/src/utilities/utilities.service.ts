import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { UtilitiesDto } from './dtos/shortening-url.dto';
import { LegacyInvitationDto, OobIssuanceInvitationDto } from './dtos/store-object.dto';
// import { StoreObjectDto } from './dtos/store-object.dto';

@Injectable()
export class UtilitiesService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('OrganizationService');
  }

  async createShorteningUrl(shorteningUrlDto: UtilitiesDto): Promise<string> {
    return this.sendNatsMessage(this.serviceProxy, 'create-shortening-url', shorteningUrlDto);
  }

  async storeObject(persistent: boolean, storeObj: LegacyInvitationDto | OobIssuanceInvitationDto): Promise<string> {
    const payload = {persistent, storeObj};
    // eslint-disable-next-line no-console
    console.log('Reached in api-gateway services. The object to store is::::::: ', JSON.stringify(payload.storeObj));
    return this.sendNatsMessage(this.serviceProxy, 'store-object-return-url', payload);
  }
}
