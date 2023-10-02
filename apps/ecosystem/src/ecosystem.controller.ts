import { Controller, Get } from '@nestjs/common';
import { EcosystemService } from './ecosystem.service';

@Controller()
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}

  @Get()
  getHello(): string {
    return this.ecosystemService.getHello();
  }
}
