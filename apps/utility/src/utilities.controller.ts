import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UtilitiesService } from './utilities.service';
import { IShorteningUrlData } from '../interfaces/shortening-url.interface';
import { EmailDto } from '@credebl/common/dtos/email.dto';

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

  @MessagePattern({ cmd: 'alert-db-ledgerId-null' })
  async handleLedgerAlert(payload: { emailDto: EmailDto }): Promise<void> {
    try {
      this.logger.debug('Received msg in alert-db-service');
      const result = await this.utilitiesService.handleLedgerAlert(payload.emailDto);
      this.logger.debug('Received result in alert-db-service');
      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
