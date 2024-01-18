import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ShorteningUrlService } from './shortening-url.service';

@Controller()
export class ShorteningUrlController {
  constructor(private readonly shorteningUrlService: ShorteningUrlService) {}

  private readonly logger = new Logger('ShorteningUrlController');

  @MessagePattern({ cmd: 'create-shortening-url' })
  async createAndStoreShorteningUrl(payload): Promise<string> {
    return this.shorteningUrlService.createAndStoreShorteningUrl(payload);
  }

  @MessagePattern({ cmd: 'get-shortening-url' })
  async getShorteningUrl(referenceId: string): Promise<object> {
    return this.shorteningUrlService.getShorteningUrl(referenceId);
  }
}