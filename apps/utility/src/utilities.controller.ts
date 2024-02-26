import { Controller, Logger } from '@nestjs/common';
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
    try {
    const url:string = await this.utilitiesService.storeObject(payload);
    return url;
    } catch (error) {
      Logger.error(error);
      throw new Error('Error occured in Utility Microservices Controller');
    }
    
  }
}