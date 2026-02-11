import { NATSClient } from '@credebl/common/NATSClient';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EcosystemOrgStatus, Invitation } from '@credebl/enum/enum';
import {
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemMemberInvitations,
  IGetAllOrgs
} from 'apps/ecosystem/interfaces/ecosystem.interfaces';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';
// eslint-disable-next-line camelcase
import { user } from '@prisma/client';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CreateIntentDto } from 'apps/ecosystem/dtos/create-intent.dto';
import { UpdateIntentDto } from 'apps/ecosystem/dtos/update-intent.dto';
import { CreateIntentTemplateDto, UpdateIntentTemplateDto } from '../utilities/dtos/intent-template.dto';
import { GetAllIntentTemplatesDto } from '../utilities/dtos/get-all-intent-templates.dto';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';
import { IPaginationSortingDto, PaginatedResponse } from 'libs/common/src/interfaces/interface';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {}

  /**
   *
   * @param createEcosystemDto
   * @returns Ecosystem creation success
   */
  async createEcosystem(createEcosystemDto: CreateEcosystemDto): Promise<IEcosystem> {
    const payload = { createEcosystemDto };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-ecosystem', payload);
  }
  /**
   *
   * @param userId
   * @returns All ecosystems from platform
   */
  async getEcosystems(userId: string, pageDetail: IPaginationSortingDto): Promise<PaginatedResponse<IEcosystem>> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystems', { userId, pageDetail });
  }

  /**
   *
   * @param ecosystemId
   * @param orgId
   * @returns Ecosystem details by ecosystemId
   */
  async getEcosystemDashboard(ecosystemId: string, orgId: string): Promise<IEcosystemDashboard> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-dashboard', { ecosystemId, orgId });
  }

  async inviteMemberToEcosystem(orgId: string, reqUser: string, ecosystemId: string): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'invite-member-to-ecosystem', {
      orgId,
      reqUser,
      ecosystemId
    });
  }

  async updateEcosystemInvitationStatus(
    status: Invitation,
    reqUser: string,
    ecosystemId: string,
    orgId: string
  ): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-invitation-status', {
      status,
      reqUser,
      ecosystemId,
      orgId
    });
  }

  async deleteEcosystemOrgs(ecosystemId: string, orgIds: string[]): Promise<{ count: number }> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-ecosystem-orgs', { orgIds, ecosystemId });
  }

  async updateEcosystemOrgStatus(
    ecosystemId: string,
    orgIds: string[],
    status: EcosystemOrgStatus
  ): Promise<{ count: number }> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-org-status', {
      orgIds,
      ecosystemId,
      status
    });
  }

  async getAllEcosystemOrgsByEcosystemId(
    ecosystemId: string,
    pageDetail: IPaginationSortingDto
  ): Promise<PaginatedResponse<IGetAllOrgs>> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-orgs', { ecosystemId, pageDetail });
  }

  // eslint-disable-next-line camelcase
  async getEcosystemMemberInvitations(
    payload: IEcosystemMemberInvitations,
    pageDetail: IPaginationSortingDto
  ): Promise<PaginatedResponse<IEcosystemInvitation>> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-member-invitations', {
      payload,
      pageDetail
    });
  }

  async getUserByKeycloakId(keycloakId: string): Promise<user> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-user-by-keycloak-id', { keycloakId });
  }

  async getEcosystemDetailsByUserId(userId: string): Promise<user> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-details-by-userid', { userId });
  }

  async getEcosystemOrgDetailsByUserId(userId: string, ecosystemId: string): Promise<user> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-org-details-by-userid', {
      userId,
      ecosystemId
    });
  }

  // Intent Template CRUD operations
  async createIntentTemplate(createIntentTemplateDto: CreateIntentTemplateDto, user: user): Promise<object> {
    const payload = { ...createIntentTemplateDto, user: { id: user.id } };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-intent-template', payload);
  }

  async getIntentTemplateById(id: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-template-by-id', id);
  }

  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-templates-by-intent-id', { intentId });
  }

  async updateIntentTemplate(
    id: string,
    updateIntentTemplateDto: UpdateIntentTemplateDto,
    user: IUserRequest
  ): Promise<object> {
    const payload = { id, ...updateIntentTemplateDto, user: { id: user.userId } };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-intent-template', payload);
  }

  async deleteIntentTemplate(id: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-intent-template', { id });
  }

  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-templates-by-org-id', { orgId });
  }
  // Intent CRUD operations

  /**
   * Create a new intent
   * @param createIntentDto Intent details
   * @param user Logged-in user
   * @returns Created intent
   */
  async createIntent(createIntentDto: CreateIntentDto): Promise<object> {
    const payload = { createIntentDto };

    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-intent', payload);
  }

  /**
   * Get all intents
   * @returns List of intents
   */
  async getIntents(
    ecosystemId: string,
    pageDetail: IPaginationSortingDto,
    intentId?: string
  ): Promise<PaginatedResponse<object>> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intents', { ecosystemId, intentId, pageDetail });
  }

  async getVerificationTemplates(orgId: string, pageDetail: IPaginationSortingDto): Promise<PaginatedResponse<object>> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-verification-templates-by-org-id', {
      orgId,
      pageDetail
    });
  }

  async getIntentTemplateByIntentAndOrg(intentName: string, verifierOrgId: string): Promise<object | null> {
    const payload = { intentName, verifierOrgId };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-template-by-intent-and-org', payload);
  }

  async getAllIntentTemplatesByQuery(
    intentTemplateSearchCriteria: GetAllIntentTemplatesDto
  ): Promise<IIntentTemplateList> {
    const payload = {
      intentTemplateSearchCriteria
    };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-all-intent-templates-by-query', payload);
  }

  /**
   * Update an intent
   * @param id Intent ID
   * @param updateIntentDto Updated intent details
   * @param user Logged-in user
   * @returns Updated intent
   */
  async updateIntent(updateIntentDto: UpdateIntentDto): Promise<object> {
    const payload = {
      updateIntentDto
    };

    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-intent', payload);
  }

  /**
   * Delete an intent
   * @param id Intent ID
   * @returns Deleted intent
   */
  async deleteIntent(ecosystemId: string, intentId: string, userId: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-intent', {
      ecosystemId,
      intentId,
      userId
    });
  }
}
