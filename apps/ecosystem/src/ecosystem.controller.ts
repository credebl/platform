import { Controller, Logger } from '@nestjs/common';
import { EcosystemOrgStatus, Invitation } from '@credebl/enum/enum';
import {
  ICreateEcosystem,
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemInvitations,
  IEcosystemMemberInvitations,
  IGetAllOrgs,
  IPlatformDashboardCount
} from '../interfaces/ecosystem.interfaces';
import {
  IIntentTemplateList,
  IIntentTemplateSearchCriteria
} from '@credebl/common/interfaces/intents-template.interface';
import { IPaginationSortingDto, PaginatedResponse } from 'libs/common/src/interfaces/interface';
import { ecosystem, user } from '@prisma/client';

import { CreateIntentDto } from '../dtos/create-intent.dto';
import { EcosystemService } from './ecosystem.service';
import { MessagePattern } from '@nestjs/microservices';
import { UpdateIntentDto } from '../dtos/update-intent.dto';

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
  async getInvitationsByUserId(payload: {
    userId: string;
    pageDetail: IPaginationSortingDto;
  }): Promise<PaginatedResponse<IEcosystemInvitations>> {
    return this.ecosystemService.getInvitationsByUserId(payload.userId, payload.pageDetail);
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
  @MessagePattern({ cmd: 'get-ecosystems' })
  async getEcosystems(payload: {
    userId: string;
    pageDetail: IPaginationSortingDto;
    orgId: string;
  }): Promise<PaginatedResponse<IEcosystem>> {
    return this.ecosystemService.getEcosystems(payload.userId, payload.pageDetail, payload.orgId);
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
    orgId: string;
  }): Promise<boolean> {
    return this.ecosystemService.updateEcosystemInvitationStatus(
      payload.status,
      payload.reqUser,
      payload.ecosystemId,
      payload.orgId
    );
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
  async getAllEcosystemOrgsByEcosystemId(payload: {
    ecosystemId: string;
    pageDetail: IPaginationSortingDto;
  }): Promise<PaginatedResponse<IGetAllOrgs>> {
    return this.ecosystemService.getAllEcosystemOrgsByEcosystemId(payload.ecosystemId, payload.pageDetail);
  }

  /**
   * Get Ecosystem member Invitations
   *
   * @param payload Contains IEcosystemMemberInvitations
   * @returns ecosystem invitations
   */
  @MessagePattern({ cmd: 'get-ecosystem-member-invitations' })
  // eslint-disable-next-line camelcase
  async getEcosystemMemberInvitations(payload: {
    payload: IEcosystemMemberInvitations;
    pageDetail: IPaginationSortingDto;
  }): Promise<PaginatedResponse<IEcosystemInvitation>> {
    return this.ecosystemService.getEcosystemMemberInvitations(payload.payload, payload.pageDetail);
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
  // Intent Template CRUD operations
  @MessagePattern({ cmd: 'create-intent-template' })
  async createIntentTemplate(payload: {
    orgId?: string;
    intentId: string;
    templateId: string;
    user: { id: string };
  }): Promise<object> {
    return this.ecosystemService.createIntentTemplate(payload);
  }

  @MessagePattern({ cmd: 'get-intent-template-by-id' })
  async getIntentTemplateById(id: string): Promise<object> {
    return this.ecosystemService.getIntentTemplateById(id);
  }

  @MessagePattern({ cmd: 'get-intent-templates-by-intent-id' })
  async getIntentTemplatesByIntentId(payload: { intentId: string }): Promise<object[]> {
    return this.ecosystemService.getIntentTemplatesByIntentId(payload.intentId);
  }

  @MessagePattern({ cmd: 'get-intent-templates-by-org-id' })
  async getIntentTemplatesByOrgId(payload: { orgId: string }): Promise<object[]> {
    return this.ecosystemService.getIntentTemplatesByOrgId(payload.orgId);
  }

  @MessagePattern({ cmd: 'get-all-intent-templates-by-query' })
  async getAllIntentTemplateByQuery(payload: {
    intentTemplateSearchCriteria: IIntentTemplateSearchCriteria;
  }): Promise<IIntentTemplateList> {
    return this.ecosystemService.getAllIntentTemplateByQuery(payload);
  }

  @MessagePattern({ cmd: 'get-intent-template-by-intent-and-org' })
  async getIntentTemplateByIntentAndOrg(payload: {
    intentName: string;
    verifierOrgId: string;
  }): Promise<object | null> {
    return this.ecosystemService.getIntentTemplateByIntentAndOrg(payload.intentName, payload.verifierOrgId);
  }

  @MessagePattern({ cmd: 'update-intent-template' })
  async updateIntentTemplate(payload: {
    id: string;
    orgId: string;
    intentId: string;
    templateId: string;
    user: { id: string };
  }): Promise<object> {
    return this.ecosystemService.updateIntentTemplate(payload.id, {
      orgId: payload.orgId,
      intentId: payload.intentId,
      templateId: payload.templateId,
      user: payload.user
    });
  }

  @MessagePattern({ cmd: 'delete-intent-template' })
  async deleteIntentTemplate(payload: { id: string }): Promise<object> {
    return this.ecosystemService.deleteIntentTemplate(payload.id);
  }
  /**
   * Create a new intent
   *
   * @param payload Contains intent details and user
   * @returns Created intent
   */
  @MessagePattern({ cmd: 'create-intent' })
  async createIntent(payload: { createIntentDto: CreateIntentDto }): Promise<object> {
    return this.ecosystemService.createIntent(payload.createIntentDto);
  }

  /**
   * Fetch all intents
   *
   * @returns List of intents
   */
  @MessagePattern({ cmd: 'get-intents' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getIntents(payload: {
    ecosystemId: string;
    intentId?: string;
    pageDetail: IPaginationSortingDto;
  }): Promise<PaginatedResponse<object>> {
    const { ecosystemId, intentId, pageDetail } = payload;

    return this.ecosystemService.getIntents(ecosystemId, pageDetail, intentId);
  }

  @MessagePattern({ cmd: 'get-verification-templates-by-org-id' })
  async getTemplatesByOrgId(payload: {
    orgId: string;
    pageDetail: IPaginationSortingDto;
  }): Promise<PaginatedResponse<object>> {
    return this.ecosystemService.getTemplatesByOrgId(payload.orgId, payload.pageDetail);
  }

  /**
   * Update an existing intent
   *
   * @param payload Contains intent ID, updated data, and user
   * @returns Updated intent
   */
  @MessagePattern({ cmd: 'update-intent' })
  async updateIntent(payload: { updateIntentDto: UpdateIntentDto }): Promise<object> {
    return this.ecosystemService.updateIntent(payload.updateIntentDto);
  }

  /**
   * Delete an intent
   *
   * @param payload Contains intent ID
   * @returns Deleted intent
   */
  @MessagePattern({ cmd: 'delete-intent' })
  async deleteIntent(payload: { ecosystemId: string; intentId: string; userId: string }): Promise<object> {
    return this.ecosystemService.deleteIntent(payload);
  }

  /**
   * Update ecosystem platform configuration
   */
  @MessagePattern({ cmd: 'update-ecosystem-config' })
  async updateEcosystemConfig(payload: {
    isEcosystemEnabled: boolean;
    platformAdminId: string;
  }): Promise<{ message: string }> {
    return this.ecosystemService.updateEcosystemConfig(payload);
  }

  @MessagePattern({ cmd: 'get-platform-admin-dashboard-count' })
  async getDashboardCountEcosystem(): Promise<IPlatformDashboardCount> {
    return this.ecosystemService.getDashboardCountEcosystem();
  }

  @MessagePattern({ cmd: 'get-ecosystem-enable-status' })
  async getEcosystemEnableStatus(): Promise<boolean> {
    return this.ecosystemService.getEcosystemEnableStatus();
  }
}
