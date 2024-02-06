/* eslint-disable prefer-destructuring */
import { organisation, user } from '@prisma/client';
import { Injectable, Logger, ConflictException, InternalServerErrorException, HttpException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import { CommonService } from '@credebl/common';
import { OrganizationRepository } from '../repositories/organization.repository';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Inject, NotFoundException } from '@nestjs/common';
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
import { Invitation, OrgAgentType, transition } from '@credebl/enum/enum';
import { IGetOrgById, IGetOrganization, IUpdateOrganization, IOrgAgent, IClientCredentials } from '../interfaces/organization.interface';
import { UserActivityService } from '@credebl/user-activity';
import { CommonConstants } from '@credebl/common/common.constant';
import { ClientRegistrationService } from '@credebl/client-registration/client-registration.service';
import { map } from 'rxjs/operators';
import { Cache } from 'cache-manager';
import { AwsService } from '@credebl/aws';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IOrgRoles } from 'libs/org-roles/interfaces/org-roles.interface';
import { IOrgCredentials, IOrganization, IOrganizationInvitations, IOrganizationDashboard } from '@credebl/common/interfaces/organization.interface';

import { ClientCredentialTokenPayloadDto } from '@credebl/client-registration/dtos/client-credential-token-payload.dto';
import { IAccessTokenData } from '@credebl/common/interfaces/interface';
@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commonService: CommonService,
    @Inject('NATS_CLIENT') private readonly organizationServiceProxy: ClientProxy,
    private readonly organizationRepository: OrganizationRepository,
    private readonly orgRoleService: OrgRolesService,
    private readonly userOrgRoleService: UserOrgRolesService,
    private readonly awsService: AwsService,
    private readonly userActivityService: UserActivityService,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
    private readonly clientRegistrationService: ClientRegistrationService
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

      if (await this.isValidBase64(createOrgDto?.logo)) {
        const imageUrl = await this.uploadFileToS3(createOrgDto.logo);
        createOrgDto.logo = imageUrl;
      } else {
        createOrgDto.logo = '';
      }
            
      const organizationDetails = await this.organizationRepository.createOrganization(createOrgDto);

      // To return selective object data
      delete organizationDetails.lastChangedBy;
      delete organizationDetails.lastChangedDateTime;
      delete organizationDetails.orgSlug;
      delete organizationDetails.website;

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
   * @param orgId 
   * @returns organization client credentials
   */
  async createOrgCredentials(orgId: string): Promise<IOrgCredentials> {
    try {

      const organizationDetails = await this.organizationRepository.getOrganizationDetails(orgId);

      if (!organizationDetails) {
        throw new ConflictException(ResponseMessages.organisation.error.orgNotFound);
      }

      const orgCredentials = await this.registerToKeycloak(organizationDetails.name, organizationDetails.id);
      
      const {clientId, clientSecret, idpId} = orgCredentials;

      const updateOrgData = {
        clientId,
        clientSecret: this.maskString(clientSecret),
        idpId
      };

      const updatedOrg = await this.organizationRepository.updateOrganizationById(updateOrgData, orgId);

      if (!updatedOrg) {
        throw new InternalServerErrorException(ResponseMessages.organisation.error.credentialsNotUpdate);
      }

      return orgCredentials;
    
    } catch (error) {
      this.logger.error(`In createOrgCredentials : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * Register the organization to keycloak
   * @param orgName 
   * @param orgId 
   * @returns client credentials
   */
  async registerToKeycloak(orgName: string, orgId: string): Promise<IOrgCredentials> {
      const token = await this.clientRegistrationService.getManagementToken();
      return this.clientRegistrationService.createClient(orgName, orgId, token);      
  }


  async deleteClientCredentials(orgId: string): Promise<string> {
      const token = await this.clientRegistrationService.getManagementToken();

      const organizationDetails = await this.organizationRepository.getOrganizationDetails(orgId);

      if (!organizationDetails) {
        throw new NotFoundException(ResponseMessages.organisation.error.orgNotFound);
      }

      try {        
        await this.clientRegistrationService.deleteClient(organizationDetails.idpId, token);     
        const updateOrgData = {
          clientId: null,
          clientSecret: null,
          idpId: null
        };
  
        await this.organizationRepository.updateOrganizationById(updateOrgData, orgId);
  
      } catch (error) {
        throw new InternalServerErrorException('Unable to delete client credentails');
      }

      return ResponseMessages.organisation.success.deleteCredentials;
  }

  /**
   * Mask string and display last 5 characters
   * @param inputString 
   * @returns 
   */
  maskString(inputString: string): string {
    if (5 <= inputString.length) {
      // Extract the last 5 characters
      const lastFiveCharacters = inputString.slice(-8);

      // Create a masked string with '*' characters
      const maskedString = '*'.repeat(inputString.length - 8) + lastFiveCharacters;

      return maskedString;
    } else {
      // If the inputString is less than 5 characters, return the original string
      return inputString;
    }
  }
  
  async isValidBase64 (value: string): Promise<boolean> {
    try {
      if (!value || 'string' !== typeof value) {
        return false;
      }
  
      const base64Regex = /^data:image\/([a-zA-Z]*);base64,([^\"]*)$/;
      const matches = value.match(base64Regex);
      return Boolean(matches) && 3 === matches.length;
    } catch (error) {
      return false;
    }
  };

  async uploadFileToS3(orgLogo: string): Promise<string> {
    try {
      const updatedOrglogo = orgLogo.split(',')[1];
      const imgData = Buffer.from(updatedOrglogo, 'base64');
      const logoUrl = await this.awsService.uploadUserCertificate(
        imgData,
        'png',
        'orgLogo',
        process.env.AWS_ORG_LOGO_BUCKET_NAME,
        'base64',
        'orgLogos'
      );
      return logoUrl;
    } catch (error) {
      this.logger.error(`In getting imageUrl : ${JSON.stringify(error)}`);
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
      
      if (await this.isValidBase64(updateOrgDto.logo)) {
        const imageUrl = await this.uploadFileToS3(updateOrgDto.logo);
        updateOrgDto.logo = imageUrl;
      } else {
        delete updateOrgDto.logo;
      }

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

  async clientLoginCredentails(clientCredentials: IClientCredentials): Promise<IAccessTokenData> {
   
    const {clientId, clientSecret} = clientCredentials;
    return this.authenticateClientKeycloak(clientId, clientSecret);
  }


  async authenticateClientKeycloak(clientId: string, clientSecret: string): Promise<IAccessTokenData> {

    try {

      const payload = new ClientCredentialTokenPayloadDto();
      // eslint-disable-next-line camelcase
      payload.client_id = clientId;
      // eslint-disable-next-line camelcase
      payload.client_secret = clientSecret;
      payload.scope = 'email profile';
      
      const mgmtTokenResponse = await this.clientRegistrationService.getToken(payload);
      return mgmtTokenResponse;

    } catch (error) {
      this.logger.error(`Error in authenticateClientKeycloak : ${JSON.stringify(error)}`);
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

        const userData = await this.getUserFirstName(userEmail);
        
        const {firstName} = userData;
        const orgRolesDetails = await this.orgRoleService.getOrgRolesByIds(orgRoleId);
       
        if (0 === orgRolesDetails.length) {
          throw new NotFoundException(ResponseMessages.organisation.error.orgRoleIdNotFound);
        }

        const isInvitationExist = await this.checkInvitationExist(email, orgId);

        if (!isInvitationExist && userEmail !== invitation.email) {

          await this.organizationRepository.createSendInvitation(email, String(orgId), String(userId), orgRoleId);

          try {
            await this.sendInviteEmailTemplate(email, organizationDetails.name, orgRolesDetails, firstName, isUserExist);
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
    firstName:string,
    isUserExist: boolean
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new OrganizationInviteTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `Invitation to join “${orgName}” on CREDEBL`;

    emailData.emailHtml = await urlEmailTemplate.sendInviteEmailTemplate(email, orgName, orgRolesDetails, firstName, isUserExist);

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
    if (userData?.isEmailVerified) {
      return true;
    }
    return false;
  }

  async getUserFirstName(userEmail: string): Promise<user> {
    const pattern = { cmd: 'get-user-by-mail' };
    const payload = { email: userEmail };

    const userData  = await this.organizationServiceProxy
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
      return userData;
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

  async fetchOrgCredentials(orgId: string): Promise<IOrgCredentials> {
    try {
      const orgCredentials = await this.organizationRepository.getOrganizationDetails(orgId);
      if (!orgCredentials.clientId) {
        throw new NotFoundException(ResponseMessages.organisation.error.notExistClientCred);
      }
      return {
        clientId: orgCredentials.clientId,
        clientSecret: orgCredentials.clientSecret
      };
    } catch (error) {
      this.logger.error(`Error in fetchOrgCredentials : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  async getOrgOwner(orgId: string): Promise<IOrganization> {
    try {
      const orgDetails = await this.organizationRepository.getOrganizationOwnerDetails(orgId, OrgRoles.OWNER);
      return orgDetails;
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