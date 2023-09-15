// eslint-disable-next-line camelcase
import { organisation, org_roles, user } from '@prisma/client';
import { Injectable, Logger, ConflictException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { CommonService } from '@credebl/common';
import { OrganizationRepository } from '../repositories/organization.repository';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { OrgRolesService } from '@credebl/org-roles';
import { OrgRoles } from 'libs/org-roles/enums';
import { UserOrgRolesService } from '@credebl/user-org-roles';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrganizationInviteTemplate } from '../templates/organization-invitation.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { CreateOrganizationDto } from '../dtos/create-organization.dto';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';
import { UpdateInvitationDto } from '../dtos/update-invitation.dt';
import { NotFoundException } from '@nestjs/common';
import { Invitation } from '@credebl/enum/enum';
import { IUpdateOrganization } from '../interfaces/organization.interface';
import { UserActivityService } from '@credebl/user-activity';
@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly organizationServiceProxy: ClientProxy,
    private readonly organizationRepository: OrganizationRepository,
    private readonly orgRoleService: OrgRolesService,
    private readonly userOrgRoleService: UserOrgRolesService,
    private readonly userActivityService: UserActivityService,
    private readonly logger: Logger
  ) { }

  /**
   *
   * @param registerOrgDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createOrganization(createOrgDto: CreateOrganizationDto, userId: number): Promise<organisation> {
    try {
      const organizationExist = await this.organizationRepository.checkOrganizationNameExist(createOrgDto.name);

      if (organizationExist) {
        throw new ConflictException(ResponseMessages.organisation.error.exists);
      }

      const orgSlug = this.createOrgSlug(createOrgDto.name);
      createOrgDto.orgSlug = orgSlug;

      const organizationDetails = await this.organizationRepository.createOrganization(createOrgDto);

      const ownerRoleData = await this.orgRoleService.getRole(OrgRoles.OWNER);

      await this.userOrgRoleService.createUserOrgRole(userId, ownerRoleData.id, organizationDetails.id);
      await this.userActivityService.createActivity(userId, organizationDetails.id, `${organizationDetails.name} organization created`, 'Get started with inviting users to join organization');
      return organizationDetails;
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }


  /**
   * 
   * @param orgName 
   * @returns OrgSlug
   */
  createOrgSlug(orgName: string): string {
  return orgName
    .toLowerCase() // Convert the input to lowercase
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters except hyphens
    .replace(/--+/g, '-'); // Replace multiple consecutive hyphens with a single hyphen
}

  /**
 *
 * @param registerOrgDto
 * @returns
 */

  // eslint-disable-next-line camelcase
  async updateOrganization(updateOrgDto: IUpdateOrganization, userId: number): Promise<organisation> {
    try {

      const organizationExist = await this.organizationRepository.checkOrganizationNameExist(updateOrgDto.name);

      if (organizationExist) {
        throw new ConflictException(ResponseMessages.organisation.error.exists);
      }

      const orgSlug = await this.createOrgSlug(updateOrgDto.name);
      updateOrgDto.orgSlug = orgSlug;

      const organizationDetails = await this.organizationRepository.updateOrganization(updateOrgDto);
      await this.userActivityService.createActivity(userId, organizationDetails.id, `${organizationDetails.name} organization updated`, 'Organization details updated successfully');
      return organizationDetails;
    } catch (error) {
      this.logger.error(`In update organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
   * Description: get organizations
   * @param 
   * @returns Get created organizations details
   */
  // eslint-disable-next-line camelcase
  async getOrganizations(userId: number, pageNumber: number, pageSize: number, search: string): Promise<object> {
    try {

      const query = {
        userOrgRoles: {
          some: { userId }
        },
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };

      const filterOptions = {
        userId
      };

      return this.organizationRepository.getOrganizations(
        query,
        filterOptions,
        pageNumber,
        pageSize
      );

    } catch (error) {
      this.logger.error(`In fetch getOrganizations : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
  * Description: get public organizations
  * @param 
  * @returns Get public organizations details
  */
  // eslint-disable-next-line camelcase
  async getPublicOrganizations(pageNumber: number, pageSize: number, search: string): Promise<object> {
    try {

      const query = {
        publicProfile: true,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };

      const filterOptions = {};

      return this.organizationRepository.getOrganizations(
        query,
        filterOptions,
        pageNumber,
        pageSize
      );

    } catch (error) {
      this.logger.error(`In fetch getPublicOrganizations : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  async getPublicProfile(payload: { orgSlug: string }): Promise<organisation> {
    const {orgSlug} = payload;
    try {

      const query = {
        orgSlug,
        publicProfile: true
      };

      const organizationDetails = await this.organizationRepository.getOrganization(query);
      if (!organizationDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.profileNotFound);
      }
      return organizationDetails;

    } catch (error) {
      this.logger.error(`get user: ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
     * Description: get organization
     * @param orgId Registration Details
     * @returns Get created organization details
     */
  // eslint-disable-next-line camelcase
  async getOrganization(orgId: number): Promise<object> {
    try {

      const query = {
        id: orgId
      };

      const organizationDetails = await this.organizationRepository.getOrganization(query);
      return organizationDetails;
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
    * Description: get invitation
    * @param orgId Registration Details
    * @returns Get created invitation details
    */
  // eslint-disable-next-line camelcase
  async getInvitationsByOrgId(orgId: number, pageNumber: number, pageSize: number, search: string): Promise<object> {
    try {
      const getOrganization = await this.organizationRepository.getInvitationsByOrgId(orgId, pageNumber, pageSize, search);
      for await (const item of getOrganization['invitations']) {
        const getOrgRoles = await this.orgRoleService.getOrgRolesByIds(item.orgRoles);
        (item['orgRoles'] as object) = getOrgRoles;
      };
      return getOrganization;
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
   *
   * @param registerOrgDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async getOrgRoles(): Promise<org_roles[]> {
    try {
      return this.orgRoleService.getOrgRoles();
    } catch (error) {
      this.logger.error(`In getOrgRoles : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
   * 
   * @param email 
   * @returns 
   */
  async checkInvitationExist(
    email: string,
    orgId: number
  ): Promise<boolean> {
    try {

      const query = {
        email,
        orgId
      };

      const invitations = await this.organizationRepository.getOrgInvitations(query);

      if (0 < invitations.length) {
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @Body sendInvitationDto
   * @returns createInvitation
   */

  // eslint-disable-next-line camelcase
  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: number): Promise<string> {
    const { invitations, orgId } = bulkInvitationDto;

    try {
      const organizationDetails = await this.organizationRepository.getOrganizationDetails(orgId);

      for (const invitation of invitations) {
        const { orgRoleId, email } = invitation;

        const isUserExist = await this.checkUserExistInPlatform(email);

        const isInvitationExist = await this.checkInvitationExist(email, orgId);

        if (!isInvitationExist) {
          await this.organizationRepository.createSendInvitation(email, orgId, userId, orgRoleId);

          const orgRolesDetails = await this.orgRoleService.getOrgRolesByIds(orgRoleId);
          try {
            await this.sendInviteEmailTemplate(email, organizationDetails.name, orgRolesDetails, isUserExist);
          } catch (error) {
            throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
          }
        }

      }
      await this.userActivityService.createActivity(userId, organizationDetails.id, `Invitations sent for ${organizationDetails.name}`, 'Get started with user role management once invitations accepted');
      return ResponseMessages.organisation.success.createInvitation;
    } catch (error) {
      this.logger.error(`In send Invitation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
   *
   * @param email
   * @param orgName
   * @param orgRolesDetails
   * @returns true/false
   */

  async sendInviteEmailTemplate(
    email: string,
    orgName: string,
    orgRolesDetails: object[],
    isUserExist: boolean
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new OrganizationInviteTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Invitation`;

    emailData.emailHtml = await urlEmailTemplate.sendInviteEmailTemplate(email, orgName, orgRolesDetails, isUserExist);

    //Email is sent to user for the verification through emailData
    const isEmailSent = await sendEmail(emailData);

    return isEmailSent;
  }

  async checkUserExistInPlatform(email: string): Promise<boolean> {
    const pattern = { cmd: 'get-user-by-mail' };
    const payload = { email };

    const userData: user = await this.organizationServiceProxy
      .send(pattern, payload)
      .toPromise()
      .catch((error) => {
        this.logger.error(`catch: ${JSON.stringify(error)}`);
        throw new HttpException(
          {
            status: error.status,
            error: error.message
          },
          error.status
        );
      });

    if (userData && userData.isEmailVerified) {
      return true;
    }
    return false;
  }

  async fetchUserInvitation(email: string, status: string, pageNumber: number, pageSize: number, search = ''): Promise<object> {
    try {
      return this.organizationRepository.getAllOrgInvitations(email, status, pageNumber, pageSize, search);
    } catch (error) {
      this.logger.error(`In fetchUserInvitation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  /**
   * 
   * @param payload 
   * @returns Updated invitation response
   */
  async updateOrgInvitation(payload: UpdateInvitationDto): Promise<string> {
    try {
      const { orgId, status, invitationId, userId } = payload;

      const invitation = await this.organizationRepository.getInvitationById(invitationId);

      if (!invitation) {
        throw new NotFoundException(ResponseMessages.user.error.invitationNotFound);
      }

      const data = {
        status
      };

      await this.organizationRepository.updateOrgInvitation(invitationId, data);

      if (status === Invitation.REJECTED) {
        return ResponseMessages.user.success.invitationReject;
      }
      for (const roleId of invitation.orgRoles) {
        await this.userOrgRoleService.createUserOrgRole(userId, roleId, orgId);
      }

      return ResponseMessages.user.success.invitationAccept;

    } catch (error) {
      this.logger.error(`In updateOrgInvitation : ${error}`);
      throw new RpcException(error.response);
    }
  }

  /**
   * 
   * @param orgId 
   * @param roleIds 
   * @param userId 
   * @returns 
   */
  async updateUserRoles(orgId: number, roleIds: number[], userId: number): Promise<boolean> {
    try {

      const isUserExistForOrg = await this.userOrgRoleService.checkUserOrgExist(userId, orgId);

      if (!isUserExistForOrg) {
        throw new NotFoundException(ResponseMessages.organisation.error.userNotFound);
      }

      const isRolesExist = await this.orgRoleService.getOrgRolesByIds(roleIds);

      if (isRolesExist && 0 === isRolesExist.length) {
        throw new NotFoundException(ResponseMessages.organisation.error.rolesNotExist);
      }

      const deleteUserRecords = await this.userOrgRoleService.deleteOrgRoles(userId, orgId);

      if (0 === deleteUserRecords['count']) {
        throw new InternalServerErrorException(ResponseMessages.organisation.error.updateUserRoles);
      }

      return this.userOrgRoleService.updateUserOrgRole(userId, orgId, roleIds);

    } catch (error) {
      this.logger.error(`Error in updateUserRoles: ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

  async getOrgDashboard(orgId: number): Promise<object> {
    try {
      return this.organizationRepository.getOrgDashboard(orgId);
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response);
    }
  }

}
