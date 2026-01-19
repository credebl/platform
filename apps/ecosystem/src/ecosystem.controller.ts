import { Controller, Logger } from '@nestjs/common';
import { EcosystemOrgStatus, Invitation } from '@credebl/enum/enum';
import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemInvitations,
  IEcosystemMemberInvitations,
  IGetAllOrgs
} from '../interfaces/ecosystem.interfaces';
import { ecosystem, user } from '@prisma/client';

import { EcosystemService } from './ecosystem.service';
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

  /**
   * Invite members to ecosystem
   *
   * @param payload Contains requesting user id and orgId
   * @returns Message
   */
  @MessagePattern({ cmd: 'invite-member-to-ecosystem' })
  async inviteMemberToEcosystem(payload: { orgId: string; reqUser: string; ecosystemId: string }): Promise<boolean> {
    return this.ecosystemService.inviteMemberToEcosystem(payload.orgId, payload.reqUser, payload.ecosystemId);
  }

  /**
   * Update ecosystem invitation status
   *
   * @param payload Contains email of invited member and status to update
   * @returns Message
   */
  @MessagePattern({ cmd: 'update-ecosystem-invitation-status' })
  async updateEcosystemInvitationStatus(payload: {
    status: Invitation;
    reqUser: string;
    ecosystemId: string;
  }): Promise<boolean> {
    return this.ecosystemService.updateEcosystemInvitationStatus(payload.status, payload.reqUser, payload.ecosystemId);
  }

  /**
   * Delete ecosystem users
   *
   * @param payload Contains userId and ecosystemId
   * @returns Message
   */
  @MessagePattern({ cmd: 'delete-ecosystem-orgs' })
  async deleteEcosystemUsers(payload: { orgIds: string[]; ecosystemId: string }): Promise<{ count: number }> {
    return this.ecosystemService.deleteOrgsFromEcosystem(payload.ecosystemId, payload.orgIds);
  }

  /**
   * Update ecosystem member status
   *
   * @param payload Contains userId, status and ecosystemId
   * @returns Message
   */
  @MessagePattern({ cmd: 'update-ecosystem-org-status' })
  async updateEcosystemOrgStatus(payload: {
    orgIds: string[];
    ecosystemId: string;
    status: EcosystemOrgStatus;
  }): Promise<{ count: number }> {
    return this.ecosystemService.updateEcosystemOrgStatus(payload.ecosystemId, payload.orgIds, payload.status);
  }

  /**
   * Fetch all ecosystem Users
   *
   * @param payload Contains ecosystemId
   * @returns ecosystem records
   */
  @MessagePattern({ cmd: 'get-ecosystem-orgs' })
  // eslint-disable-next-line camelcase
  async getAllEcosystemOrgsByEcosystemId(payload: { ecosystemId: string }): Promise<IGetAllOrgs[]> {
    return this.ecosystemService.getAllEcosystemOrgsByEcosystemId(payload.ecosystemId);
  }

  /**
   * Get Ecosystem member Invitations
   *
   * @param payload Contains IEcosystemMemberInvitations
   * @returns ecosystem invitations
   */
  @MessagePattern({ cmd: 'get-ecosystem-member-invitations' })
  // eslint-disable-next-line camelcase
  async getEcosystemMemberInvitations(payload: IEcosystemMemberInvitations): Promise<IEcosystemInvitation[]> {
    return this.ecosystemService.getEcosystemMemberInvitations(payload);
  }

  @MessagePattern({ cmd: 'get-user-by-keycloak-id' })
  // eslint-disable-next-line camelcase
  async getUserByKeycloakId(payload: { keycloakId: string }): Promise<user> {
    return this.ecosystemService.getUserByKeycloakId(payload.keycloakId);
  }

  @MessagePattern({ cmd: 'get-ecosystem-details-by-userid' })
  // eslint-disable-next-line camelcase
  async getEcosystemDetailsByUserId(payload: { userId: string }): Promise<ecosystem> {
    return this.ecosystemService.getEcosystemDetailsByUserId(payload.userId);
  }

  @MessagePattern({ cmd: 'get-ecosystem-org-details-by-userid' })
  // eslint-disable-next-line camelcase
  async getEcosystemOrgDetailsByUserId(payload: {
    userId: string;
    ecosystemId: string;
  }): Promise<{ ecosystemRole: { name: string } }[]> {
    return this.ecosystemService.getEcosystemOrgDetailsByUserId(payload.userId, payload.ecosystemId);
  }
}
