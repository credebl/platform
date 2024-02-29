import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UtilitiesService } from './utilities.service';
import { IShorteningUrlData } from '../interfaces/shortening-url.interface';

@Controller()
export class UtilitiesController {
  constructor(
    private readonly utilitiesService: UtilitiesService,
    private readonly logger: Logger
  ) {}

  @MessagePattern({ cmd: 'create-shortening-url' })
  async createAndStoreShorteningUrl(payload: IShorteningUrlData): Promise<string> {
    return this.utilitiesService.createAndStoreShorteningUrl(payload);
  }

  @MessagePattern({ cmd: 'get-shortening-url' })
  async getShorteningUrl(referenceId: string): Promise<object> {
    return this.utilitiesService.getShorteningUrl(referenceId);
  }

  @MessagePattern({ cmd: 'store-object-return-url' })
  async storeObject(payload: { persistent: boolean; storeObj: unknown }): Promise<string> {
    try {
      const url: string = await this.utilitiesService.storeObject(payload);
      return url;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error occured in Utility Microservices Controller');
    }
  }
}
