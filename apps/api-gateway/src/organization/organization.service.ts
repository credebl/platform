import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { CreateOrganizationDto } from './dtos/create-organization-dto';
import { GetAllOrganizationsDto } from './dtos/get-all-organizations.dto';
import { GetAllSentInvitationsDto } from './dtos/get-all-sent-invitations.dto';
import { BulkSendInvitationDto } from './dtos/send-invitation.dto';
import { UpdateUserRolesDto } from './dtos/update-user-roles.dto';
import { UpdateOrganizationDto } from './dtos/update-organization-dto';
import { GetAllUsersDto } from '../user/dto/get-all-users.dto';
import { IOrgRoles } from 'libs/org-roles/interfaces/org-roles.interface';
import { organisation } from '@prisma/client';
import { IGetOrgById, IGetOrganization } from 'apps/organization/interfaces/organization.interface';
import { IOrganizationInvitations } from '@credebl/common/interfaces/organizations.interface';
import { IOrgUsers } from 'apps/user/interfaces/user.interface';
import { IOrganizationDashboard } from '@credebl/common/interfaces/organization.interface';

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
   * @param updateOrgDto
   * @returns Organization update Success
   */
  async updateOrganization(updateOrgDto: UpdateOrganizationDto, userId: string, orgId: string): Promise<organisation> {
    const payload = { updateOrgDto, userId, orgId };
    return this.sendNats(this.serviceProxy, 'update-organization', payload);
  }

  /**
   *
   * @param
   * @returns Organizations details
   */

  async getOrganizations(getAllOrgsDto: GetAllOrganizationsDto, userId: string): Promise<IGetOrganization> {
    const payload = { userId, ...getAllOrgsDto };
    const fetchOrgs = await this.sendNats(this.serviceProxy, 'get-organizations', payload);
    return fetchOrgs;
  }
  
  /**
   *
   * @param
   * @returns Public organizations list
   */
  async getPublicOrganizations(getAllOrgsDto: GetAllOrganizationsDto): Promise<IGetOrganization> {
    const payload = { ...getAllOrgsDto };
    return this.sendNats(this.serviceProxy, 'get-public-organizations', payload);
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

  /**
   *
   * @param orgId
   * @returns Invitations details
   */
  async getInvitationsByOrgId(
    orgId: string,
    getAllInvitationsDto: GetAllSentInvitationsDto
  ): Promise<IOrganizationInvitations> {
    const { pageNumber, pageSize, search } = getAllInvitationsDto;
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
    getAllUsersDto: GetAllUsersDto
  ): Promise<IOrgUsers> {
    const { pageNumber, pageSize, search } = getAllUsersDto;
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
    orgId: number
  ): Promise<boolean> {
    const payload = { orgId };

    return this.sendNats(this.serviceProxy, 'delete-organization', payload);
  }

  async deleteOrganizationInvitation(
    orgId: string,
    invitationId: string
  ): Promise<boolean> {
    const payload = {orgId, invitationId};
    return this.sendNatsMessage(this.serviceProxy, 'delete-organization-invitation', payload);
  }
}
