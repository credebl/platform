import { Controller, Logger } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { EcosystemService } from './ecosystem.service';
import { Body } from '@nestjs/common';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';

@Controller()
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}
  private readonly logger = new Logger('EcosystemController');

  /**
   * Description: create new ecosystem
   * @param payload Registration Details
   * @returns Get created ecosystem details
   */

  @MessagePattern({ cmd: 'create-ecosystem' })
  async createEcosystem(@Body() payload: { createEcosystemDto }): Promise<object> {
    return this.ecosystemService.createEcosystem(payload.createEcosystemDto);
  }

  /**
   * Description: edit ecosystem
   * @param payload updation Details
   * @returns Get updated ecosystem details
   */
  @MessagePattern({ cmd: 'edit-ecosystem' }) 
  async editEcosystem(@Body() payload: { editEcosystemDto, ecosystemId }): Promise<object> {
    return this.ecosystemService.editEcosystem(payload.editEcosystemDto, payload.ecosystemId);
  }

  /**
   * Description: get all ecosystems
   * @param payload Registration Details
   * @returns Get all ecosystem details
   */
  @MessagePattern({ cmd: 'get-all-ecosystem' })
  async getAllEcosystems(): Promise<object> {
    return this.ecosystemService.getAllEcosystem();
  }


  /**
   * 
   * @param payload 
   * @returns Sent ecosystem invitations status
   */
  @MessagePattern({ cmd: 'send-ecosystem-invitation' })
  async createInvitation(
    @Body() payload: { bulkInvitationDto: BulkSendInvitationDto; userId: string }
    ): Promise<string> {
    return this.ecosystemService.createInvitation(payload.bulkInvitationDto, payload.userId);
  }
  
}