import { Body, Controller, Logger } from '@nestjs/common';

import { EcosystemService } from './ecosystem.service';
import { IEcosystemInvitations } from '../interfaces/ecosystem.interfaces';
import { MessagePattern } from '@nestjs/microservices';
import { SendEcosystemCreateDto } from 'apps/api-gateway/src/ecosystem/dtos/send-ecosystem-invitation';

@Controller()
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}
  private readonly logger = new Logger('EcosystemController');

  /**
   * Description: create new ecosystem
   * @param payload Registration Details
   * @returns Get created ecosystem details
   */

  @MessagePattern({ cmd: 'create-ecosystem-invitation' })
  async ecosystemCreateInvitation(@Body() payload: SendEcosystemCreateDto): Promise<IEcosystemInvitations> {
    return this.ecosystemService.ecosystemCreateInvitation(payload);
  }

  // /**
  //  * Description: create new ecosystem
  //  * @param payload Registration Details
  //  * @returns Get created ecosystem details
  //  */

  // @MessagePattern({ cmd: 'create-ecosystem' })
  // async createEcosystem(@Body() payload: { createEcosystemDto }): Promise<IEcosystem> {
  //   return this.ecosystemService.createEcosystem(payload.createEcosystemDto);
  // }
}
