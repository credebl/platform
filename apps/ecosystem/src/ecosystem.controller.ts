import { Controller, Logger } from '@nestjs/common';

import { EcosystemService } from './ecosystem.service';
import { IEcosystemInvitations } from '../interfaces/ecosystem.interfaces';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}
  private readonly logger = new Logger('EcosystemController');

  /**
   * Description: create new ecosystem
   * @param payload Registration Details
   * @returns Get created ecosystem details
   */

  @MessagePattern({ cmd: 'invite-user-for-ecosystem-creation' })
  async inviteUserToCreateEcosystem(payload: { email: string; userId: string }): Promise<IEcosystemInvitations> {
    return this.ecosystemService.inviteUserToCreateEcosystem(payload);
  }

  @MessagePattern({ cmd: 'get-ecosystem-invitations-by-user' })
  async getInvitationsByUserId(payload: { userId: string }): Promise<IEcosystemInvitations[]> {
    return this.ecosystemService.getInvitationsByUserId(payload.userId);
  }

  @MessagePattern({ cmd: 'invite-member-to-ecosystem' })
  async inviteMemberToEcosystem(payload: { orgId: string }): Promise<void> {
    this.ecosystemService.inviteMemberToEcosystem(payload.orgId);
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
