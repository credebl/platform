import { Controller, Logger } from '@nestjs/common';
import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitations
} from '../interfaces/ecosystem.interfaces';

import { EcosystemService } from './ecosystem.service';
import { Invitation } from '@credebl/enum/enum';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class EcosystemController {
  constructor(private readonly ecosystemService: EcosystemService) {}
  private readonly logger = new Logger('EcosystemController');

  /**
   * Description: Invite user to create new ecosystem
   * @param payload Invitation Details
   * @returns Success message
   */

  @MessagePattern({ cmd: 'invite-user-for-ecosystem-creation' })
  async inviteUserToCreateEcosystem(payload: {
    email: string;
    platformAdminId: string;
  }): Promise<IEcosystemInvitations> {
    return this.ecosystemService.inviteUserToCreateEcosystem(payload);
  }

  /**
   * Fetch ecosystem invitations created by a specific user
   *
   * @param payload Contains userId
   * @returns List of ecosystem invitations
   */
  @MessagePattern({ cmd: 'get-ecosystem-invitations-by-user' })
  async getInvitationsByUserId(payload: { userId: string }): Promise<IEcosystemInvitations[]> {
    return this.ecosystemService.getInvitationsByUserId(payload.userId);
  }

  /**
   * Create a new ecosystem
   *
   * @param payload Contains create ecosystem DTO
   * @returns Created ecosystem details
   */
  @MessagePattern({ cmd: 'create-ecosystem' })
  async createEcosystem(payload: { createEcosystemDto: ICreateEcosystem }): Promise<IEcosystem> {
    return this.ecosystemService.createEcosystem(payload.createEcosystemDto);
  }

  /**
   * Fetch all ecosystems on the platform
   *
   * Used by Platform Admin
   * @returns List of ecosystems
   */
  @MessagePattern({ cmd: 'get-all-ecosystems' })
  async getAllEcosystems(): Promise<IEcosystem[]> {
    return this.ecosystemService.getAllEcosystems();
  }

  /**
   * Fetch ecosystem dashboard details
   *
   * @param payload Contains ecosystemId and orgId
   * @returns Ecosystem dashboard data
   */
  @MessagePattern({ cmd: 'get-ecosystem-dashboard' })
  async getEcosystemDashboard(payload: { ecosystemId: string; orgId: string }): Promise<IEcosystemDashboard> {
    return this.ecosystemService.getEcosystemDashboard(payload.ecosystemId, payload.orgId);
  }

  @MessagePattern({ cmd: 'invite-member-to-ecosystem' })
  async inviteMemberToEcosystem(payload: { orgId: string }): Promise<boolean> {
    return this.ecosystemService.inviteMemberToEcosystem(payload.orgId);
  }

  @MessagePattern({ cmd: 'update-ecosystem-invitation-status' })
  async updateEcosystemInvitationStatus(payload: { email: string; status: Invitation }): Promise<boolean> {
    return this.ecosystemService.updateEcosystemInvitationStatus(payload.email, payload.status);
  }
}
