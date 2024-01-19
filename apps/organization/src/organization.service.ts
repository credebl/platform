import { organisation, user } from '@prisma/client';
import { Injectable, Logger, ConflictException, InternalServerErrorException, HttpException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
import { Invitation, OrgAgentType, transition } from '@credebl/enum/enum';
import { IGetOrgById, IGetOrganization, IUpdateOrganization, IOrgAgent } from '../interfaces/organization.interface';
import { UserActivityService } from '@credebl/user-activity';
import { CommonConstants } from '@credebl/common/common.constant';
import { map } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IOrgRoles } from 'libs/org-roles/interfaces/org-roles.interface';
import { IOrganizationInvitations, IOrganizationDashboard  } from '@credebl/common/interfaces/organization.interface';
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
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) { }

  /**
   *
   * @param registerOrgDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createOrganization(createOrgDto: CreateOrganizationDto, userId: string): Promise<organisation> {
    try {
      const organizationExist = await this.organizationRepository.checkOrganizationNameExist(createOrgDto.name);

      if (organizationExist) {
        throw new ConflictException(ResponseMessages.organisation.error.exists);
      }

      const orgSlug = this.createOrgSlug(createOrgDto.name);
      createOrgDto.orgSlug = orgSlug;
      createOrgDto.createdBy = userId;
      createOrgDto.lastChangedBy = userId;

      const organizationDetails = await this.organizationRepository.createOrganization(createOrgDto);

      const ownerRoleData = await this.orgRoleService.getRole(OrgRoles.OWNER);

      await this.userOrgRoleService.createUserOrgRole(userId, ownerRoleData.id, organizationDetails.id);
      await this.userActivityService.createActivity(userId, organizationDetails.id, `${organizationDetails.name} organization created`, 'Get started with inviting users to join organization');
      return organizationDetails;
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
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
  async updateOrganization(updateOrgDto: IUpdateOrganization, userId: string, orgId: string): Promise<organisation> {
    try {

      const organizationExist = await this.organizationRepository.checkOrganizationExist(updateOrgDto.name, orgId);

      if (0 === organizationExist.length) {
        const organizationExist = await this.organizationRepository.checkOrganizationNameExist(updateOrgDto.name);
        if (organizationExist) {
          throw new ConflictException(ResponseMessages.organisation.error.exists);
        }
      }

      const orgSlug = await this.createOrgSlug(updateOrgDto.name);
      updateOrgDto.orgSlug = orgSlug;
      updateOrgDto.userId = userId;
      const organizationDetails = await this.organizationRepository.updateOrganization(updateOrgDto);
      await this.userActivityService.createActivity(userId, organizationDetails.id, `${organizationDetails.name} organization updated`, 'Organization details updated successfully');
      return organizationDetails;
    } catch (error) {
      this.logger.error(`In update organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * @returns Get created organizations details
   */

  async getOrganizations(userId: string, pageNumber: number, pageSize: number, search: string): Promise<IGetOrganization> {
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

      const getOrgs = await this.organizationRepository.getOrganizations(
        query,
        filterOptions,
        pageNumber,
        pageSize
      );
      return getOrgs;

    } catch (error) {
      this.logger.error(`In fetch getOrganizations : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Description: get public organizations
   * @param
   * @returns Get public organizations details
   */

  async getPublicOrganizations(pageNumber: number, pageSize: number, search: string): Promise<IGetOrganization> {
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
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getPublicProfile(payload: { orgSlug: string }): Promise<IGetOrgById> {
    const { orgSlug } = payload;
    try {

      const query = {
        orgSlug,
        publicProfile: true
      };

      const organizationDetails = await this.organizationRepository.getOrganization(query);
      if (!organizationDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgProfileNotFound);
      }

      const credDefs = await this.organizationRepository.getCredDefByOrg(organizationDetails.id);
      organizationDetails['credential_definitions'] = credDefs;
      return organizationDetails;

    } catch (error) {
      this.logger.error(`get user: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Description: get organization
   * @param orgId Registration Details
   * @returns Get created organization details
   */

  async getOrganization(orgId: string): Promise<IGetOrgById> {
    try {

      const query = {
        id: orgId
      };

      const organizationDetails = await this.organizationRepository.getOrganization(query);
      return organizationDetails;
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Description: get invitation
   * @param orgId Registration Details
   * @returns Get created invitation details
   */

  async getInvitationsByOrgId(orgId: string, pageNumber: number, pageSize: number, search: string): Promise<IOrganizationInvitations> {
    try {
      const getOrganization = await this.organizationRepository.getInvitationsByOrgId(orgId, pageNumber, pageSize, search);
      for await (const item of getOrganization['invitations']) {
        const getOrgRoles = await this.orgRoleService.getOrgRolesByIds(item['orgRoles']);
        (item['orgRoles'] as object) = getOrgRoles;
      };
      return getOrganization;
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @returns organization roles
   */


  async getOrgRoles(): Promise<IOrgRoles[]> {
    try {
      return this.orgRoleService.getOrgRoles();
    } catch (error) {
      this.logger.error(`In getOrgRoles : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param email
   * @returns
   */
  async checkInvitationExist(
    email: string,
    orgId: string
  ): Promise<boolean> {
    try {

      const query = {
        email,
        orgId
      };

      const invitations = await this.organizationRepository.getOrgInvitations(query);

      let isPendingInvitation = false;
      let isAcceptedInvitation = false;

      for (const invitation of invitations) {
        if (invitation.status === Invitation.PENDING) {
          isPendingInvitation = true;
        }
        if (invitation.status === Invitation.ACCEPTED) {
          isAcceptedInvitation = true;
        }
      }

      if (isPendingInvitation || isAcceptedInvitation) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @Body sendInvitationDto
   * @returns createInvitation
   */


  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: string, userEmail: string): Promise<string> {
    const { invitations, orgId } = bulkInvitationDto;

    try {
      const organizationDetails = await this.organizationRepository.getOrganizationDetails(orgId);

      for (const invitation of invitations) {
        const { orgRoleId, email } = invitation;

        const isUserExist = await this.checkUserExistInPlatform(email);

        const orgRolesDetails = await this.orgRoleService.getOrgRolesByIds(orgRoleId);
       
        if (0 === orgRolesDetails.length) {
          throw new NotFoundException(ResponseMessages.organisation.error.orgRoleIdNotFound);
        }

        const isInvitationExist = await this.checkInvitationExist(email, orgId);

        if (!isInvitationExist && userEmail !== invitation.email) {

          await this.organizationRepository.createSendInvitation(email, String(orgId), String(userId), orgRoleId);

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
      throw new RpcException(error.response ? error.response : error);
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

  async fetchUserInvitation(email: string, status: string, pageNumber: number, pageSize: number, search = ''): Promise<IOrganizationInvitations> {
    try {
      return this.organizationRepository.getAllOrgInvitations(email, status, pageNumber, pageSize, search);
    } catch (error) {
      this.logger.error(`In fetchUserInvitation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
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
      const invitation = await this.organizationRepository.getInvitationById(String(invitationId));

      if (!invitation) {
        throw new NotFoundException(ResponseMessages.user.error.invitationNotFound);
      }

      if (invitation.orgId !== orgId) {
        throw new NotFoundException(ResponseMessages.user.error.invalidOrgId);
      }

      const invitationStatus = invitation.status as Invitation;
      if (!transition(invitationStatus, payload.status)) {
        throw new BadRequestException(`${ResponseMessages.user.error.invitationStatusUpdateInvalid} ${invitation.status}`);
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
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param orgId
   * @param roleIds
   * @param userId
   * @returns
   */
  async updateUserRoles(orgId: string, roleIds: string[], userId: string): Promise<boolean> {
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
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getOrgDashboard(orgId: string): Promise<IOrganizationDashboard> {
    try {
            return this.organizationRepository.getOrgDashboard(orgId);
    } catch (error) {
      this.logger.error(`In create organization : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getOrgPofile(orgId: string): Promise<organisation> {
    try {
      const orgProfile = await this.organizationRepository.getOrgProfile(orgId);
      if (!orgProfile.logoUrl || '' === orgProfile.logoUrl) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgProfile);
      }
      return orgProfile;
    } catch (error) {
      this.logger.error(`get organization profile : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteOrganization(orgId: string): Promise<boolean> {
    try {
      const getAgent = await this.organizationRepository.getAgentEndPoint(orgId);
      // const apiKey = await this._getOrgAgentApiKey(orgId);
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      this.logger.log(`cachedApiKey----${apiKey}`);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      let url;
      if (getAgent.orgAgentTypeId === OrgAgentType.DEDICATED) {
        url = `${getAgent.agentEndPoint}${CommonConstants.URL_DELETE_WALLET}`;

      } else if (getAgent.orgAgentTypeId === OrgAgentType.SHARED) {
        url = `${getAgent.agentEndPoint}${CommonConstants.URL_DELETE_SHARED_WALLET}`.replace('#', getAgent.tenantId);
      }

      const payload = {
        url,
        apiKey
      };

      const deleteWallet = await this._deleteWallet(payload);
      if (deleteWallet) {

        const orgDelete = await this.organizationRepository.deleteOrg(orgId);
        if (false === orgDelete) {
          throw new NotFoundException(ResponseMessages.organisation.error.deleteOrg);
        }
      }


      return true;
    } catch (error) {
      this.logger.error(`delete organization: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _deleteWallet(payload: IOrgAgent): Promise<{
    response;
  }> {
    try {
      const pattern = {
        cmd: 'delete-wallet'
      };

      return this.organizationServiceProxy
        .send<string>(pattern, payload)
        .pipe(
          map((response) => (
            {
            response
          }))
        ).toPromise()
        .catch(error => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            }, error.error);
        });
    } catch (error) {
      this.logger.error(`[_deleteWallet] - error in delete wallet : ${JSON.stringify(error)}`);
      throw error;
    }
  }


  async _getOrgAgentApiKey(orgId: string): Promise<string> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.organizationServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
          status: error.status,
          error: error.message
        }, error.status);
    }
  }

  async deleteOrganizationInvitation(orgId: string, invitationId: string): Promise<boolean> {
    try {
      const invitationDetails = await this.organizationRepository.getInvitationById(invitationId);

      // Check invitation is present
      if (!invitationDetails) {
        throw new NotFoundException(ResponseMessages.user.error.invitationNotFound);
      }

      // Check if delete process initiated by the org who has created invitation
      if (orgId !== invitationDetails.orgId) {
        throw new ForbiddenException(ResponseMessages.organisation.error.deleteOrgInvitation);
      }

      // Check if invitation is already accepted/rejected
      if (Invitation.PENDING !== invitationDetails.status) {
        throw new BadRequestException(ResponseMessages.organisation.error.invitationStatusInvalid);
      }

      await this.organizationRepository.deleteOrganizationInvitation(invitationId);

      return true;
    } catch (error) {
      this.logger.error(`delete organization invitation: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
}