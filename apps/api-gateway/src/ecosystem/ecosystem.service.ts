import { NATSClient } from '@credebl/common/NATSClient';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EcosystemOrgStatus, Invitation } from '@credebl/enum/enum';
import {
  IEcosystem,
  IEcosystemDashboard,
  IEcosystemInvitation,
  IEcosystemMemberInvitations
} from 'apps/ecosystem/interfaces/ecosystem.interfaces';
// eslint-disable-next-line camelcase
import { ecosystem_orgs } from '@prisma/client';
import { CreateEcosystemDto } from 'apps/ecosystem/dtos/create-ecosystem-dto';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { GetAllIntentTemplatesDto } from '../utilities/dtos/get-all-intent-templates.dto';
import { CreateIntentTemplateDto, UpdateIntentTemplateDto } from '../utilities/dtos/intent-template.dto';
import { CreateIntentDto } from './dtos/create-intent.dto';
import { UpdateIntentDto } from './dtos/update-intent.dto';

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

  async updateEcosystemInvitationStatus(status: Invitation, reqUser: string, ecosystemId: string): Promise<boolean> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-invitation-status', {
      status,
      reqUser,
      ecosystemId
    });
  }

  async deleteEcosystemOrgs(ecosystemId: string, userIds: string[]): Promise<{ count: number }> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-ecosystem-orgs', { userIds, ecosystemId });
  }

  async updateEcosystemOrgStatus(
    ecosystemId: string,
    userIds: string[],
    status: EcosystemOrgStatus
  ): Promise<{ count: number }> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-ecosystem-org-status', {
      userIds,
      ecosystemId,
      status
    });
  }

  // eslint-disable-next-line camelcase
  async getAllEcosystemOrgsByEcosystemId(ecosystemId: string): Promise<ecosystem_orgs[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-orgs', { ecosystemId });
  }

  // eslint-disable-next-line camelcase
  async getEcosystemMemberInvitations(payload: IEcosystemMemberInvitations): Promise<IEcosystemInvitation[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-ecosystem-member-invitations', payload);
  }
  // Intent Template CRUD operations
  async createIntentTemplate(createIntentTemplateDto: CreateIntentTemplateDto, user: IUserRequest): Promise<object> {
    const payload = { ...createIntentTemplateDto, user };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-intent-template', payload);
  }

  async getIntentTemplateById(id: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-template-by-id', id);
  }

  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-templates-by-intent-id', intentId);
  }

  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-templates-by-org-id', orgId);
  }

  async getAllIntentTemplatesByQuery(
    intentTemplateSearchCriteria: GetAllIntentTemplatesDto
  ): Promise<IIntentTemplateList> {
    const payload = {
      intentTemplateSearchCriteria
    };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-all-intent-templates-by-query', payload);
  }

  async getIntentTemplateByIntentAndOrg(intentName: string, verifierOrgId: string): Promise<object | null> {
    const payload = { intentName, verifierOrgId };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-template-by-intent-and-org', payload);
  }

  async updateIntentTemplate(
    id: string,
    updateIntentTemplateDto: UpdateIntentTemplateDto,
    user: IUserRequest
  ): Promise<object> {
    const payload = { id, ...updateIntentTemplateDto, user };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-intent-template', payload);
  }

  async deleteIntentTemplate(id: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-intent-template', id);
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
  async getIntents(ecosystemId: string, intentId?: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intents', { ecosystemId, intentId });
  }

  async getVerificationTemplates(orgId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-verification-templates-by-org-id', { orgId });
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
  async deleteIntent(ecosystemId: string, intentId: string, user: IUserRequest): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-intent', { ecosystemId, intentId, user });
  }
}
