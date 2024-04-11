import { Controller, Logger } from '@nestjs/common';

import { MessagePattern } from '@nestjs/microservices';
import { OrganizationService } from './organization.service';
import { Body } from '@nestjs/common';
import { CreateOrganizationDto } from '../dtos/create-organization.dto';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';
import { UpdateInvitationDto } from '../dtos/update-invitation.dt';
import { DidList, IGetOrgById, IGetOrganization, IUpdateOrganization, Payload } from '../interfaces/organization.interface';
import { organisation } from '@prisma/client';
import { IOrgCredentials, IOrganizationInvitations, IOrganization, IOrganizationDashboard } from '@credebl/common/interfaces/organization.interface';
import { IAccessTokenData } from '@credebl/common/interfaces/interface';
import { IClientRoles } from '@credebl/client-registration/interfaces/client.interface';

@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
  private readonly logger = new Logger('OrganizationController');

  /**
   * Description: create new organization
   * @param payload Registration Details
   * @returns Get created organization details
   */

  @MessagePattern({ cmd: 'create-organization' })
  async createOrganization(@Body() payload: { createOrgDto: CreateOrganizationDto; userId: string, keycloakUserId: string }): Promise<organisation> {
    return this.organizationService.createOrganization(payload.createOrgDto, payload.userId, payload.keycloakUserId);
  }

  /**
   * Description: create new organization
   * @param payload Registration Details
   * @returns Get created organization details
   */

  @MessagePattern({ cmd: 'set-primary-did' })
  async setPrimaryDid(@Body() payload: { orgId:string, did:string, id:string}): Promise<object> {
    return this.organizationService.setPrimaryDid(payload.orgId, payload.did, payload.id);
  }

  /**
   * 
   * @param payload 
   * @returns organization client credentials
   */
  @MessagePattern({ cmd: 'create-org-credentials' })
  async createOrgCredentials(@Body() payload: { orgId: string; userId: string, keycloakUserId: string }): Promise<IOrgCredentials> {
    return this.organizationService.createOrgCredentials(payload.orgId, payload.userId, payload.keycloakUserId);
  }

  /**
   * Description: update organization
   * @param payload Registration Details
   * @returns Get updated organization details
   */

  @MessagePattern({ cmd: 'update-organization' })
  async updateOrganization(payload: { updateOrgDto: IUpdateOrganization; userId: string, orgId: string }): Promise<organisation> {
    return this.organizationService.updateOrganization(payload.updateOrgDto, payload.userId, payload.orgId);
  }

  /**
   *
   * @param payload
   * @returns organization's did list
   */
  @MessagePattern({ cmd: 'fetch-organization-dids' })
  async getOrgDidList(payload: {orgId:string}): Promise<DidList[]> {
    return this.organizationService.getOrgDidList(payload.orgId);
  }

  /**
   * Description: get organizations
   * @param
   * @returns Get created organization details
   */
  @MessagePattern({ cmd: 'get-organizations' })
  async getOrganizations(
    @Body() payload: { userId: string} & Payload
  ): Promise<IGetOrganization> {
    const { userId, pageNumber, pageSize, search } = payload;
    return this.organizationService.getOrganizations(userId, pageNumber, pageSize, search);
  }

  /**
   * @returns Get public organization details
   */
  @MessagePattern({ cmd: 'get-public-organizations' })
  async getPublicOrganizations(
    @Body() payload: Payload
  ): Promise<IGetOrganization> {
    const { pageNumber, pageSize, search } = payload;
    return this.organizationService.getPublicOrganizations(pageNumber, pageSize, search);
  }

  /**
   * Description: get organization
   * @param payload Registration Details
   * @returns Get created organization details
   */
  @MessagePattern({ cmd: 'get-organization-by-id' })
  async getOrganization(@Body() payload: { orgId: string; userId: string}): Promise<IGetOrgById> {
    return this.organizationService.getOrganization(payload.orgId);
  }
/**
 * @param orgSlug 
 * @returns organization details
 */
  @MessagePattern({ cmd: 'get-organization-public-profile' })
  async getPublicProfile(payload: { orgSlug }): Promise<IGetOrgById> {
    return this.organizationService.getPublicProfile(payload);
  }

  /**
   * Description: get invitations
   * @param orgId
   * @returns Get created invitation details
   */
  @MessagePattern({ cmd: 'get-invitations-by-orgId' })
  async getInvitationsByOrgId(
    @Body() payload: { orgId: string } & Payload
  ): Promise<IOrganizationInvitations> {
    return this.organizationService.getInvitationsByOrgId(
      payload.orgId,
      payload.pageNumber,
      payload.pageSize,
      payload.search
    );
  }

  /**
   * @returns Get org-roles 
   */

  @MessagePattern({ cmd: 'get-org-roles' })
  async getOrgRoles(payload: {orgId: string}): Promise<IClientRoles[]> {
    return this.organizationService.getOrgRoles(payload.orgId);
  }

  @MessagePattern({ cmd: 'register-orgs-users-map' })
  async registerOrgsMapUsers(): Promise<string> {
    return this.organizationService.registerOrgsMapUsers();
  }

  /**
   * Description: create new organization invitation
   * @param payload invitation Details
   * @returns Get created organization invitation details
   */
  @MessagePattern({ cmd: 'send-invitation' })
  async createInvitation(
    @Body() payload: { bulkInvitationDto: BulkSendInvitationDto; userId: string, userEmail: string }
  ): Promise<string> {
    return this.organizationService.createInvitation(payload.bulkInvitationDto, payload.userId, payload.userEmail);
  }

  @MessagePattern({ cmd: 'fetch-user-invitations' })
  async fetchUserInvitation(
    @Body() payload: { email: string; status: string } & Payload
  ): Promise<IOrganizationInvitations> {
    return this.organizationService.fetchUserInvitation(
      payload.email,
      payload.status,
      payload.pageNumber,
      payload.pageSize,
      payload.search
    );
  }

  /**
   *
   * @param payload
   * @returns Updated invitation status
   */
  @MessagePattern({ cmd: 'update-invitation-status' })
  async updateOrgInvitation(@Body() payload: UpdateInvitationDto): Promise<string> {
    return this.organizationService.updateOrgInvitation(payload);
  }

  /**
   *
   * @param payload
   * @returns Update user roles response
   */

  @MessagePattern({ cmd: 'update-user-roles' })
  async updateUserRoles(payload: { orgId: string; roleIds: string[]; userId: string}): Promise<boolean> {
    return this.organizationService.updateUserRoles(payload.orgId, payload.roleIds, payload.userId);
  }

  @MessagePattern({ cmd: 'get-organization-dashboard' })
  async getOrgDashboard(payload: { orgId: string; userId: string }): Promise<IOrganizationDashboard> {
    return this.organizationService.getOrgDashboard(payload.orgId);
  }

/**
 * @returns organization profile details
 */
  @MessagePattern({ cmd: 'fetch-organization-profile' })
  async getOrgPofile(payload: { orgId: string }): Promise<organisation> {
    return this.organizationService.getOrgPofile(payload.orgId);
  }

  @MessagePattern({ cmd: 'get-organization-owner' })
  async getOrgOwner(orgId: string): Promise<IOrganization> {
    return this.organizationService.getOrgOwner(orgId);
  }

  @MessagePattern({ cmd: 'fetch-org-client-credentials' })
  async fetchOrgCredentials(payload: { orgId: string }): Promise<IOrgCredentials> {
    return this.organizationService.fetchOrgCredentials(payload.orgId);
  }

  @MessagePattern({ cmd: 'delete-organization' })
  async deleteOrganization(payload: { orgId: string }): Promise<boolean> {
    return this.organizationService.deleteOrganization(payload.orgId);
  }

  @MessagePattern({ cmd: 'delete-org-client-credentials' })
  async deleteOrganizationCredentials(payload: { orgId: string }): Promise<string> {
    return this.organizationService.deleteClientCredentials(payload.orgId);
  }

  @MessagePattern({ cmd: 'delete-organization-invitation' })
  async deleteOrganizationInvitation(payload: { orgId: string; invitationId: string; }): Promise<boolean> {
    return this.organizationService.deleteOrganizationInvitation(payload.orgId, payload.invitationId);
  }

  @MessagePattern({ cmd: 'authenticate-client-credentials' })
  async clientLoginCredentails(payload: { clientId: string; clientSecret: string;}): Promise<IAccessTokenData> {
    return this.organizationService.clientLoginCredentails(payload);
  }
}
