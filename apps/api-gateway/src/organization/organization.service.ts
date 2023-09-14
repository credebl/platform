import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { CreateOrganizationDto } from './dtos/create-organization-dto';
import { GetAllOrganizationsDto } from './dtos/get-all-organizations.dto';
import { GetAllSentInvitationsDto } from './dtos/get-all-sent-invitations.dto';
import { BulkSendInvitationDto } from './dtos/send-invitation.dto';
import { UpdateUserRolesDto } from './dtos/update-user-roles.dto';
import { UpdateOrganizationDto } from './dtos/update-organization-dto';

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
  async createOrganization(createOrgDto: CreateOrganizationDto, userId: number): Promise<object> {
    try {
      const payload = { createOrgDto, userId };
      return this.sendNats(this.serviceProxy, 'create-organization', payload);
    } catch (error) {
      this.logger.error(`In service Error: ${error}`);
      throw new RpcException(error.response);
    }
  }

  /**
   *
   * @param updateOrgDto
   * @returns Organization update Success
   */
  async updateOrganization(updateOrgDto: UpdateOrganizationDto, userId: number): Promise<object> {
    try {
      const payload = { updateOrgDto, userId };
      return this.sendNats(this.serviceProxy, 'update-organization', payload);
    } catch (error) {
      this.logger.error(`In service Error: ${error}`);
      throw new RpcException(error.response);
    }
  }

  /**
   *
   * @param
   * @returns Organizations details
   */
  async getOrganizations(getAllOrgsDto: GetAllOrganizationsDto, userId: number): Promise<{ response: object }> {
    const payload = { userId, ...getAllOrgsDto };
    return this.sendNats(this.serviceProxy, 'get-organizations', payload);
  }

  /**
   *
   * @param
   * @returns Public organizations list
   */
  async getPublicOrganizations(getAllOrgsDto: GetAllOrganizationsDto): Promise<{ response: object }> {
    const payload = { ...getAllOrgsDto };
    return this.sendNats(this.serviceProxy, 'get-public-organizations', payload);
  }

  async getPublicProfile(orgSlug: string): Promise<{ response: object }> {
    const payload = {orgSlug };
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
  async getOrganization(orgId: number, userId: number): Promise<{ response: object }> {
    const payload = { orgId, userId };
    return this.sendNats(this.serviceProxy, 'get-organization-by-id', payload);
  }

  /**
   *
   * @param orgId
   * @returns Invitations details
   */
  async getInvitationsByOrgId(
    orgId: number,
    getAllInvitationsDto: GetAllSentInvitationsDto
  ): Promise<{ response: object }> {
    const { pageNumber, pageSize, search } = getAllInvitationsDto;
    const payload = { orgId, pageNumber, pageSize, search };
    return this.sendNats(this.serviceProxy, 'get-invitations-by-orgId', payload);
  }

  async getOrganizationDashboard(orgId: number, userId: number): Promise<{ response: object }> {
    const payload = { orgId, userId };
    return this.sendNats(this.serviceProxy, 'get-organization-dashboard', payload);
  }

  /**
   *
   * @param
   * @returns get organization roles
   */
  async getOrgRoles(): Promise<object> {
    try {
      const payload = {};
      return this.sendNats(this.serviceProxy, 'get-org-roles', payload);
    } catch (error) {
      this.logger.error(`In service Error: ${error}`);
      throw new RpcException(error.response);
    }
  }

  /**
   *
   * @param sendInvitationDto
   * @returns Organization invitation creation Success
   */
  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: number): Promise<object> {
    try {
      const payload = { bulkInvitationDto, userId };
      return this.sendNats(this.serviceProxy, 'send-invitation', payload);
    } catch (error) {
      this.logger.error(`In service Error: ${error}`);
      throw new RpcException(error.response);
    }
  }

  /**
   *
   * @param updateUserDto
   * @param userId
   * @returns User roles update response
   */
  async updateUserRoles(updateUserDto: UpdateUserRolesDto, userId: number): Promise<{ response: boolean }> {
    const payload = { orgId: updateUserDto.orgId, roleIds: updateUserDto.orgRoleId, userId };
    return this.sendNats(this.serviceProxy, 'update-user-roles', payload);
  }
}
