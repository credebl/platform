import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { CreateOrganizationDto } from './dtos/create-organization-dto';
import { BulkSendInvitationDto } from './dtos/send-invitation.dto';
import { UpdateUserRolesDto } from './dtos/update-user-roles.dto';
import { UpdateOrganizationDto } from './dtos/update-organization-dto';
import { IOrgRoles } from 'libs/org-roles/interfaces/org-roles.interface';
import { organisation } from '@prisma/client';
import { IGetOrgById, IGetOrganization } from 'apps/organization/interfaces/organization.interface';
import { IOrganizationInvitations, IOrganizationDashboard} from '@credebl/common/interfaces/organization.interface';
import { IOrgUsers } from 'apps/user/interfaces/user.interface';
import { IOrgCredentials, IOrganization, IOrganizationDashboard } from '@credebl/common/interfaces/organization.interface';
import { ClientCredentialsDto } from './dtos/client-credentials.dto';
import { IAccessTokenData } from '@credebl/common/interfaces/interface';

@Injectable()
export class OrganizationService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('OrganizationService');
  }

  /**
   *
   * @param createOrgDto
   * @returns Organization creation Success
   */
  async createOrganization(createOrgDto: CreateOrganizationDto, userId: string): Promise<organisation> {
    const payload = { createOrgDto, userId };
    return this.sendNats(this.serviceProxy, 'create-organization', payload);
  }

  /**
   * 
   * @param orgId 
   * @param userId 
   * @returns Orgnization client credentials
   */
  async createOrgCredentials(orgId: string, userId: string): Promise<IOrgCredentials> {
    const payload = { orgId, userId };
    return this.sendNatsMessage(this.serviceProxy, 'create-org-credentials', payload);
  }

  /**
   *
   * @param updateOrgDto
   * @returns Organization update Success
   */
  async updateOrganization(updateOrgDto: UpdateOrganizationDto, userId: string, orgId: string): Promise<organisation> {
    const payload = { updateOrgDto, userId, orgId };
    return this.sendNats(this.serviceProxy, 'update-organization', payload);
  }

  /**
   * 
   * @param orgId 
   * @returns Organization details with owner
   */
  async findOrganizationOwner(orgId: string): Promise<IOrganization> {
    return this.sendNatsMessage(this.serviceProxy, 'get-organization-owner', orgId);
  }

  /**
   *
   * @param
   * @returns Organizations details
   */

  async getOrganizations(paginationDto: PaginationDto, userId: string): Promise<IGetOrganization> {
    const payload = { userId, ...paginationDto };
    const fetchOrgs = await this.sendNatsMessage(this.serviceProxy, 'get-organizations', payload);
    return fetchOrgs;
  }
  
  /**
   *
   * @param
   * @returns Public organizations list
   */
  async getPublicOrganizations(paginationDto: PaginationDto): Promise<IGetOrganization> {
    const payload = { ...paginationDto };
    const PublicOrg = this.sendNatsMessage(this.serviceProxy, 'get-public-organizations', payload);
    return PublicOrg;
  }

  async getPublicProfile(orgSlug: string): Promise<IGetOrgById> {
    const payload = { orgSlug };
    try {
      return this.sendNats(this.serviceProxy, 'get-organization-public-profile', payload);
    } catch (error) {
      this.logger.error(`Error in get user:${JSON.stringify(error)}`);
    }
  }

  /**
   *
   * @param orgId
   * @returns Organization get Success
   */
  async getOrganization(orgId: string, userId: string): Promise<IGetOrgById> {
    const payload = { orgId, userId };
    return this.sendNats(this.serviceProxy, 'get-organization-by-id', payload);
  }

  async fetchOrgCredentials(orgId: string, userId: string): Promise<IOrgCredentials> {
    const payload = { orgId, userId };
    return this.sendNatsMessage(this.serviceProxy, 'fetch-org-client-credentials', payload);
  }

  /**
   *
   * @param orgId
   * @returns Invitations details
   */
  async getInvitationsByOrgId(
    orgId: string,
    pagination: PaginationDto
  ): Promise<IOrganizationInvitations> {
    const { pageNumber, pageSize, search } = pagination;
    const payload = { orgId, pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'get-invitations-by-orgId', payload);
  }
  
  async getOrganizationDashboard(orgId: string, userId: string): Promise<IOrganizationDashboard> {
    const payload = { orgId, userId };
    return this.sendNats(this.serviceProxy, 'get-organization-dashboard', payload);
  }

  /**
   *
   * @param
   * @returns get organization roles
   */

  async getOrgRoles(): Promise<IOrgRoles[]> {
    const payload = {};
    return this.sendNats(this.serviceProxy, 'get-org-roles', payload);
  }

  /**
   *
   * @param sendInvitationDto
   * @returns Organization invitation creation Success
   */
  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: string, userEmail: string): Promise<string> {
    const payload = { bulkInvitationDto, userId, userEmail };
    return this.sendNats(this.serviceProxy, 'send-invitation', payload);
  }

  /**
   *
   * @param updateUserDto
   * @param userId
   * @returns User roles update response
   */
  async updateUserRoles(updateUserDto: UpdateUserRolesDto, userId: string): Promise<boolean> {
    const payload = { orgId: updateUserDto.orgId, roleIds: updateUserDto.orgRoleId, userId };
    return this.sendNats(this.serviceProxy, 'update-user-roles', payload);
  }

  async getOrgUsers(
    orgId: string,
    paginationDto: PaginationDto
  ): Promise<IOrgUsers> {
    const { pageNumber, pageSize, search } = paginationDto;
    const payload = { orgId, pageNumber, pageSize, search };

    return this.sendNats(this.serviceProxy, 'fetch-organization-user', payload);
  }

  async getOrgPofile(
    orgId: string
  ): Promise<organisation> {
    const payload = { orgId };

    return this.sendNats(this.serviceProxy, 'fetch-organization-profile', payload);
  }

  async deleteOrganization(
    orgId: string
  ): Promise<boolean> {
    const payload = { orgId };

    return this.sendNats(this.serviceProxy, 'delete-organization', payload);
  }

  async deleteOrgClientCredentials(
    orgId: string
  ): Promise<string> {
    const payload = { orgId };

    return this.sendNatsMessage(this.serviceProxy, 'delete-org-client-credentials', payload);
  }

  async deleteOrganizationInvitation(
    orgId: string,
    invitationId: string
  ): Promise<boolean> {
    const payload = {orgId, invitationId};
    return this.sendNatsMessage(this.serviceProxy, 'delete-organization-invitation', payload);
  }

  async clientLoginCredentials(
    clientCredentialsDto: ClientCredentialsDto
  ): Promise<IAccessTokenData> {
    return this.sendNatsMessage(this.serviceProxy, 'authenticate-client-credentials', clientCredentialsDto);
  }

}
