import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UtilitiesService } from './utilities.service';
import { IShorteningUrlData, IStoreObject } from '../interfaces/shortening-url.interface';

@Controller()
export class UtilitiesController {
  constructor(private readonly utilitiesService: UtilitiesService) {}

  @MessagePattern({ cmd: 'create-shortening-url' })
  async createAndStoreShorteningUrl(payload: IShorteningUrlData): Promise<string> {
    return this.utilitiesService.createAndStoreShorteningUrl(payload);
  }

  @MessagePattern({ cmd: 'get-shortening-url' })
  async getShorteningUrl(referenceId: string): Promise<object> {
    return this.utilitiesService.getShorteningUrl(referenceId);
  }

  @MessagePattern({ cmd: 'store-object-return-url' })
  async storeObject(payload: {persistent: boolean, storeObj: IStoreObject}): Promise<string> {
    // eslint-disable-next-line no-console
    console.log('Reached in Utility microservice controller. The object to store is::::::: ', JSON.stringify(payload.storeObj));
    const url:string = await this.utilitiesService.storeObject(payload);
    // eslint-disable-next-line no-console
    console.log('Received `url` in Utility microservice controller:::::::', url);
  return url;
  }
}