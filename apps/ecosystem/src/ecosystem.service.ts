/* eslint-disable prefer-destructuring */
// eslint-disable-next-line camelcase
import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { EcosystemRepository } from './ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaService } from '@credebl/prisma-service';
import { EcosystemInviteTemplate } from '../templates/EcosystemInviteTemplate';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { AcceptRejectEcosystemInvitationDto } from '../dtos/accept-reject-ecosysteminvitation.dto';
import { EcosystemConfigSettings, Invitation, OrgAgentType, SchemaType } from '@credebl/enum/enum';
import {
  DeploymentModeType,
  EcosystemOrgStatus,
  EcosystemRoles,
  endorsementTransactionStatus,
  endorsementTransactionType
} from '../enums/ecosystem.enum';
import { FetchInvitationsPayload } from '../interfaces/invitations.interface';
import { EcosystemMembersPayload } from '../interfaces/ecosystemMembers.interface';
import {
  CreateEcosystem,
  CredDefMessage,
  IEcosystemDashboard,
  LedgerDetails,
  OrganizationData,
  RequestCredDeffEndorsement,
  SaveSchema,
  SchemaMessage,
  SignedTransactionMessage,
  saveCredDef,
  submitTransactionPayload,
  IEcosystem,
  IEcosystemInvitation,
  IEcosystemInvitations,
  IEditEcosystem,
  IEndorsementTransaction,
  IEcosystemList,
  IEcosystemLeadOrgs
} from '../interfaces/ecosystem.interfaces';
import { GetAllSchemaList, GetEndorsementsPayload, ISchemasResponse } from '../interfaces/endorsements.interface';
import { CommonConstants } from '@credebl/common/common.constant';
// eslint-disable-next-line camelcase
import {
  RecordType,
  // eslint-disable-next-line camelcase
  credential_definition,
  // eslint-disable-next-line camelcase
  endorsement_transaction,
  // eslint-disable-next-line camelcase
  org_agents,
  // eslint-disable-next-line camelcase
  platform_config,
  schema,
  user
} from '@prisma/client';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { updateEcosystemOrgsDto } from '../dtos/update-ecosystemOrgs.dto';
import { IEcosystemDataDeletionResults, IEcosystemDetails } from '@credebl/common/interfaces/ecosystem.interface';
import { OrgRoles } from 'libs/org-roles/enums';
import { DeleteEcosystemMemberTemplate } from '../templates/DeleteEcosystemMemberTemplate';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { IOrgData } from '@credebl/common/interfaces/organization.interface';
import { checkDidLedgerAndNetwork } from '@credebl/common/cast.helper';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly logger: Logger,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  /**
   *
   * @param createEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem(createEcosystemDto: CreateEcosystem): Promise<IEcosystem> {
    try {
      const ecosystemExist = await this.ecosystemRepository.checkEcosystemNameExist(createEcosystemDto.name);

      if (ecosystemExist) {
        throw new ConflictException(ResponseMessages.ecosystem.error.exists);
      }

      const isMultiEcosystemEnabled = await this.ecosystemRepository.getSpecificEcosystemConfig(
        EcosystemConfigSettings.MULTI_ECOSYSTEM
      );

      if (isMultiEcosystemEnabled && 'false' === isMultiEcosystemEnabled.value) {
        const ecoOrganizationList = await this.ecosystemRepository.checkEcosystemOrgs(createEcosystemDto.orgId);

        for (const organization of ecoOrganizationList) {
          if (organization['ecosystemRole']['name'] === EcosystemRoles.ECOSYSTEM_MEMBER) {
            throw new ConflictException(ResponseMessages.ecosystem.error.ecosystemOrgAlready);
          }
        }
      }

      const orgDetails: OrganizationData = await this.getOrganizationDetails(
        createEcosystemDto.orgId,
        createEcosystemDto.userId
      );

      if (!orgDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgNotExist);
      }

      if (0 === orgDetails.org_agents.length) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgDidNotExist);
      }

      const ecosystemLedgers = orgDetails.org_agents.map((agent) => agent.ledgers?.id);

      const createEcosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto, ecosystemLedgers);
      if (!createEcosystem) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.notCreated);
      }

      return createEcosystem;
    } catch (error) {
      this.logger.error(`createEcosystem: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getOrganizationDetails(orgId: string, userId: string): Promise<OrganizationData> {
    const pattern = { cmd: 'get-organization-by-id' };
    const payload = { orgId, userId };

    const orgData = await this.ecosystemServiceProxy
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

    return orgData;
  }

  async getEcosystems(orgId: string): Promise<number> {
    try {
      return await this.ecosystemRepository.getEcosystemsCount(orgId);
    } catch (error) {
      this.logger.error(`[getEcosystemsCount ] [NATS call]- error in get ecosystems count : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param editEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async editEcosystem(editEcosystemDto: CreateEcosystem, ecosystemId: string): Promise<IEditEcosystem> {
    try {
      const { name, description, tags, logo, autoEndorsement, userId } = editEcosystemDto;

      const updateData: CreateEcosystem = {
        lastChangedBy: userId
      };

      if (name) {
        updateData.name = name;
      }

      if (description) {
        updateData.description = description;
      }

      if (tags) {
        updateData.tags = tags;
      }

      if (logo) {
        updateData.logoUrl = logo;
      }

      if ('' !== autoEndorsement.toString()) {
        updateData.autoEndorsement = autoEndorsement;
      }

      const ecosystemExist = await this.ecosystemRepository.checkEcosystemExist(editEcosystemDto.name, ecosystemId);

      if (0 === ecosystemExist.length) {
        const ecosystemExist = await this.ecosystemRepository.checkEcosystemNameExist(editEcosystemDto.name);
        if (ecosystemExist) {
          throw new ConflictException(ResponseMessages.ecosystem.error.exists);
        }
      }

      const editEcosystem = await this.ecosystemRepository.updateEcosystemById(updateData, ecosystemId);
      if (!editEcosystem) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.update);
      }

      // Removed unnecessary key from object
      delete editEcosystem.deletedAt;

      return editEcosystem;
    } catch (error) {
      this.logger.error(`In update ecosystem : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   *
   * @returns all ecosystem details
   */

  async getAllEcosystem(payload: IEcosystemList): Promise<IEcosystemDetails> {
    try {
      const { orgId, pageNumber, pageSize, search } = payload;

      const getEcosystemOrgs = await this.ecosystemRepository.getAllEcosystemDetails(
        orgId,
        pageNumber,
        pageSize,
        search
      );

      const ecosystemListDetails = {
        totalItems: getEcosystemOrgs[1],
        hasNextPage: payload.pageSize * payload.pageNumber < getEcosystemOrgs[1],
        hasPreviousPage: 1 < payload.pageNumber,
        nextPage: Number(payload.pageNumber) + 1,
        previousPage: payload.pageNumber - 1,
        lastPage: Math.ceil(getEcosystemOrgs[1] / payload.pageSize),
        ecosystemList: getEcosystemOrgs[0]
      };

      return ecosystemListDetails;
    } catch (error) {
      this.logger.error(`In fetch ecosystem list : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   *
   * @returns ecosystem dashboard details
   */
  async getEcosystemDashboardDetails(ecosystemId: string): Promise<IEcosystemDashboard> {
    try {
      const endorseMemberCount = await this.ecosystemRepository.getEcosystemDashboardDetails(ecosystemId);

      const query = {
        ecosystemId,
        ecosystemRole: {
          name: EcosystemRoles.ECOSYSTEM_LEAD
        }
      };

      const ecosystemDetails = await this.ecosystemRepository.fetchEcosystemOrg(query);

      const dashboardDetails: IEcosystemDashboard = {
        ecosystem: ecosystemDetails['ecosystem'],
        membersCount: endorseMemberCount.membersCount,
        endorsementsCount: endorseMemberCount.endorsementsCount,
        ecosystemLead: {
          role: ecosystemDetails['ecosystemRole']['name'],
          orgName: ecosystemDetails['organisation']['name'],
          config: endorseMemberCount.ecosystemConfigData
        }
      };

      return dashboardDetails;
    } catch (error) {
      this.logger.error(`In ecosystem dashboard details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async fetchLedgerDetailsbyId(id: string): Promise<LedgerDetails> {
    const pattern = { cmd: 'get-network-details-by-id' };
    const payload = { id };

    return this.ecosystemServiceProxy
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
  }

  /**
   * Description: get an ecosystem invitation
   * @returns Get sent ecosystem invitation details
   */

  // eslint-disable-next-line camelcase
  async getEcosystemInvitations(
    userEmail: string,
    status: string,
    pageNumber: number,
    pageSize: number,
    search: string
  ): Promise<IEcosystemInvitation> {
    try {
      const query = {
        AND: [{ email: userEmail }, { status: { contains: search, mode: 'insensitive' } }]
      };

      const ecosystemInvitations = await this.ecosystemRepository.getEcosystemInvitationsPagination(
        query,
        pageNumber,
        pageSize
      );

      for (const invitation of ecosystemInvitations.invitations) {
        const ledgerNetworks = invitation.ecosystem.ledgers;

        const ledgerData = [];

        if (Array.isArray(ledgerNetworks)) {
          for (const ledger of ledgerNetworks) {
            const ledgerDetails = await this.fetchLedgerDetailsbyId(ledger.toString());
            ledgerData.push(ledgerDetails);
          }
          invitation.ecosystem.networkDetails = ledgerData;
        }
      }

      return ecosystemInvitations;
    } catch (error) {
      this.logger.error(`In error getEcosystemInvitations: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   * @param bulkInvitationDto
   * @param userId
   * @returns
   */
  async createInvitation(
    bulkInvitationDto: BulkSendInvitationDto,
    userId: string,
    userEmail: string,
    orgId: string
  ): Promise<IEcosystemInvitations[]> {
    const { invitations, ecosystemId } = bulkInvitationDto;
    const invitationResponse = [];
    try {
      const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);

      if (
        !ecosystemDetails.ledgers ||
        (Array.isArray(ecosystemDetails.ledgers) && 0 === ecosystemDetails.ledgers.length)
      ) {
        const ecosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

        const ecosystemAgents = await this.ecosystemRepository.getAllAgentDetails(ecosystemLeadDetails.orgId);

        const ecosystemLedgers = ecosystemAgents.map((agent) => agent.ledgerId);

        const updateData: CreateEcosystem = {
          ledgers: ecosystemLedgers
        };

        await this.ecosystemRepository.updateEcosystemById(updateData, ecosystemId);
      }

      for (const invitation of invitations) {
        const { email } = invitation;

        const isUserExist = await this.checkUserExistInPlatform(email);

        const userData = await this.getEcoUserName(userEmail);

        const { firstName } = userData;

        const orgDetails: OrganizationData = await this.getOrganizationDetails(orgId, userId);

        const isInvitationExist = await this.checkInvitationExist(email, ecosystemId);

        if (!isInvitationExist && userEmail !== invitation.email) {
          const createInvitation = await this.ecosystemRepository.createSendInvitation(email, ecosystemId, userId);
          // Removed unnecessary keys from object
          delete createInvitation.lastChangedDateTime;
          delete createInvitation.lastChangedBy;
          delete createInvitation.deletedAt;
          invitationResponse.push(createInvitation);
          try {
            await this.sendInviteEmailTemplate(email, ecosystemDetails.name, firstName, orgDetails.name, isUserExist);
          } catch (error) {
            throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
          }
        }
      }
      return invitationResponse;
    } catch (error) {
      this.logger.error(`In send Invitation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async addOrganizationsInEcosystem(ecosystemLeadOrgs: IEcosystemLeadOrgs): Promise<{
    results: { statusCode: number; message: string; error?: string; data?: { orgId: string } }[];
    statusCode: number;
    message: string;
  }> {
    try {
      const ecosystemRoleDetails = await this.ecosystemRepository.getEcosystemRole(EcosystemRoles.ECOSYSTEM_MEMBER);

      const getEcosystemDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemLeadOrgs.ecosystemId);
      const getEcosystemLeadOrg = getEcosystemDetails?.orgId;
      const getEcosystemLeadOrgLedgerDetails = await this.ecosystemRepository.getAgentDetails(getEcosystemLeadOrg);
      const getEcosystemLeadOrgLedgerId = getEcosystemLeadOrgLedgerDetails?.ledgerId;

      const { organizationIds } = ecosystemLeadOrgs;
      const errorOrgs: { statusCode: number; message: string; error?: string; data?: { orgId: string } }[] = [];
      const addedOrgs = [];
      let successCount: number = 0;
      let errorCount: number = 0;

      for (const orgId of organizationIds) {
        const result: { statusCode: number; message: string; error?: string; data?: { orgId: string } } = {
          statusCode: 0,
          message: ''
        };

        const orgAgentDetails = await this.ecosystemRepository.getAgentDetails(orgId);
        const getOrgLedgerId = orgAgentDetails?.ledgerId;
        if (orgAgentDetails?.orgDid) {
          const existingOrg = await this.ecosystemRepository.checkOrgExistsInEcosystem(
            orgId,
            ecosystemLeadOrgs.ecosystemId
          );
          if (getOrgLedgerId === getEcosystemLeadOrgLedgerId) {
            if (!existingOrg) {
              addedOrgs.push({
                orgId,
                ecosystemId: ecosystemLeadOrgs.ecosystemId,
                ecosystemRoleId: ecosystemRoleDetails.id,
                status: EcosystemOrgStatus.ACTIVE,
                deploymentMode: DeploymentModeType.PROVIDER_HOSTED,
                createdBy: ecosystemLeadOrgs.userId,
                lastChangedBy: ecosystemLeadOrgs.userId
              });
              successCount++;
            } else {
              result.statusCode = HttpStatus.CONFLICT;
              result.message = `${ResponseMessages.ecosystem.error.orgAlreadyExists}`;
              result.error = `${ResponseMessages.ecosystem.error.unableToAdd}`;
              result.data = { orgId };
              errorCount++;
            }
          } else {
            result.statusCode = HttpStatus.BAD_REQUEST;
            result.message = `${ResponseMessages.ecosystem.error.ledgerNotMatch}`;
            result.error = `${ResponseMessages.ecosystem.error.unableToAdd}`;
            result.data = { orgId };
            errorCount++;
          }
        } else {
          result.statusCode = HttpStatus.BAD_REQUEST;
          result.message = `${ResponseMessages.ecosystem.error.agentNotSpunUp}`;
          result.error = `${ResponseMessages.ecosystem.error.unableToAdd}`;
          result.data = { orgId };
          errorCount++;
        }
        if (0 !== result.statusCode) {
          errorOrgs.push(result);
        }
      }
      let statusCode = HttpStatus.CREATED;
      let message = ResponseMessages.ecosystem.success.add;
      let getOrgs = [];

      if (0 < addedOrgs?.length) {
        const orgs = addedOrgs.map((item) => item.orgId);
        await this.ecosystemRepository.addOrganizationInEcosystem(addedOrgs);

        //need to discuss
        getOrgs = await this.ecosystemRepository.getEcosystemOrgs(orgs, ecosystemLeadOrgs.ecosystemId);
      }

      const success =
        0 < getOrgs?.length
          ? getOrgs?.map((item) => ({
              statusCode: HttpStatus.CREATED,
              message: `${ResponseMessages.ecosystem.success.add}`,
              data: {
                orgId: item.orgId
              }
            }))
          : [];
      const finalResult = [...errorOrgs, ...success];

      if (0 === successCount) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = ResponseMessages.ecosystem.error.unableToAdd;
      } else if (0 < errorCount && 0 < successCount) {
        statusCode = HttpStatus.PARTIAL_CONTENT;
        message = ResponseMessages.ecosystem.error.partiallyAdded;
      }

      return { results: finalResult, statusCode, message };
    } catch (error) {
      this.logger.error(`In add organizations: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async checkLedgerMatches(orgDetails: OrganizationData, ecosystemId: string): Promise<boolean> {
    const orgLedgers = orgDetails.org_agents.map((agent) => agent.ledgers.id);

    const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);

    let isLedgerFound = false;

    for (const ledger of orgLedgers) {
      // Check if the ledger is present in the ecosystem
      if (Array.isArray(ecosystemDetails.ledgers) && ecosystemDetails.ledgers.includes(ledger)) {
        // If a ledger is found, return true
        isLedgerFound = true;
      }
    }

    return isLedgerFound;
  }

  /**
   *
   * @param acceptRejectEcosystemInvitation
   * @param userId
   * @returns Ecosystem invitation status
   */
  async acceptRejectEcosystemInvitations(
    acceptRejectInvitation: AcceptRejectEcosystemInvitationDto,
    email: string
  ): Promise<string> {
    try {
      const isMultiEcosystemEnabled = await this.ecosystemRepository.getSpecificEcosystemConfig(
        EcosystemConfigSettings.MULTI_ECOSYSTEM
      );
      if (
        isMultiEcosystemEnabled &&
        'false' === isMultiEcosystemEnabled.value &&
        acceptRejectInvitation.status !== Invitation.REJECTED
      ) {
        const checkOrganization = await this.ecosystemRepository.checkEcosystemOrgs(acceptRejectInvitation.orgId);
        if (0 < checkOrganization.length) {
          throw new ConflictException(ResponseMessages.ecosystem.error.ecosystemOrgAlready);
        }
      }

      const { orgId, status, invitationId, orgName, orgDid, userId } = acceptRejectInvitation;
      const invitation = await this.ecosystemRepository.getEcosystemInvitationById(invitationId, email);
      if (!invitation) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.invitationNotFound);
      }

      const orgDetails: OrganizationData = await this.getOrganizationDetails(
        acceptRejectInvitation.orgId,
        acceptRejectInvitation.userId
      );

      if (!orgDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgNotExist);
      }

      if (0 === orgDetails.org_agents.length) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgDidNotExist);
      }

      const isLedgerFound = await this.checkLedgerMatches(orgDetails, invitation.ecosystemId);

      if (!isLedgerFound && Invitation.REJECTED !== status) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ledgerNotMatch);
      }

      const updatedInvitation = await this.updateEcosystemInvitation(invitationId, orgId, status);
      if (!updatedInvitation) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.invitationNotUpdate);
      }

      if (status === Invitation.REJECTED) {
        return ResponseMessages.ecosystem.success.invitationReject;
      }

      const ecosystemRole = await this.ecosystemRepository.getEcosystemRole(EcosystemRoles.ECOSYSTEM_MEMBER);
      const updateEcosystemOrgs = await this.updatedEcosystemOrgs(
        orgId,
        orgName,
        orgDid,
        invitation.ecosystemId,
        ecosystemRole.id,
        userId
      );

      if (!updateEcosystemOrgs) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgsNotUpdate);
      }
      return ResponseMessages.ecosystem.success.invitationAccept;
    } catch (error) {
      this.logger.error(`acceptRejectEcosystemInvitations: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async updatedEcosystemOrgs(
    orgId: string,
    orgName: string,
    orgDid: string,
    ecosystemId: string,
    ecosystemRoleId: string,
    userId: string
  ): Promise<object> {
    try {
      const data: updateEcosystemOrgsDto = {
        orgId,
        status: EcosystemOrgStatus.ACTIVE,
        ecosystemId,
        ecosystemRoleId,
        orgName,
        orgDid,
        createdBy: userId,
        lastChangedBy: userId
      };
      return await this.ecosystemRepository.updateEcosystemOrgs(data);
    } catch (error) {
      this.logger.error(`In newEcosystemMneber : ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param payload
   * @returns Updated invitation response
   */
  async updateEcosystemInvitation(invitationId: string, orgId: string, status: string): Promise<object> {
    try {
      const data = {
        status,
        orgId: String(orgId)
      };
      return this.ecosystemRepository.updateEcosystemInvitation(invitationId, data);
    } catch (error) {
      this.logger.error(`In updateOrgInvitation : ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param email
   * @param ecosystemId
   * @returns Returns boolean status for invitation
   */
  async checkInvitationExist(email: string, ecosystemId: string): Promise<boolean> {
    try {
      const query = {
        email,
        ecosystemId
      };

      const invitations = await this.ecosystemRepository.getEcosystemInvitations(query);

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
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param email
   * @param ecosystemName
   * @returns Send invitation mail
   */
  async sendInviteEmailTemplate(
    email: string,
    ecosystemName: string,
    firstName: string,
    orgName: string,
    isUserExist: boolean
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new EcosystemInviteTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `Invitation to join an Ecosystem “${ecosystemName}” on ${process.env.PLATFORM_NAME}`;

    emailData.emailHtml = await urlEmailTemplate.sendInviteEmailTemplate(
      email,
      ecosystemName,
      firstName,
      orgName,
      isUserExist
    );

    //Email is sent to user for the verification through emailData
    const isEmailSent = await sendEmail(emailData);

    return isEmailSent;
  }

  async checkUserExistInPlatform(email: string): Promise<boolean> {
    const pattern = { cmd: 'get-user-by-mail' };
    const payload = { email };

    const userData: user = await this.ecosystemServiceProxy
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

  async getEcoUserName(userEmail: string): Promise<user> {
    const pattern = { cmd: 'get-user-by-mail' };
    const payload = { email: userEmail };

    const userData = await this.ecosystemServiceProxy
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

  // eslint-disable-next-line camelcase
  async removeEndorsementTransactionFields(transactionObject: endorsement_transaction): Promise<void> {
    const transaction = transactionObject;

    // To return selective response
    delete transaction.requestPayload;
    delete transaction.responsePayload;
    delete transaction.lastChangedDateTime;
    delete transaction.lastChangedBy;
    delete transaction.deletedAt;
    delete transaction.requestBody;
    delete transaction.resourceId;
  }

  /**
   *
   * @param IRequestSchemaEndorsement
   * @returns
   */

  async requestSchemaEndorsement(
    requestSchemaPayload: IRequestSchemaEndorsement,
    user: user,
    orgId: string,
    ecosystemId: string
  ): Promise<IEndorsementTransaction> {
    try {
      const platformConfig = await this.ecosystemRepository.getPlatformConfigDetails();
      if (!platformConfig) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.platformConfigNotFound);
      }

      const agentDetails = await this.ecosystemRepository.getAgentDetails(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.schema.error.agentDetailsNotFound, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.notFound
        });
      }
      const { schemaPayload, type, endorse } = requestSchemaPayload;

      let isSchemaExist;
      if (type === SchemaTypeEnum.INDY) {
        const indySchema = schemaPayload as IRequestIndySchemaEndorsement;
        const { schemaName, schemaVersion } = indySchema;
        isSchemaExist = await this._schemaExist(schemaName, schemaVersion);
        this.logger.log(`isSchemaExist ::: ${JSON.stringify(isSchemaExist.length)}`);

        if (0 !== isSchemaExist.length) {
          throw new ConflictException(ResponseMessages.ecosystem.error.schemaAlreadyExist);
        }

        if (0 === schemaName.length) {
          throw new BadRequestException(ResponseMessages.schema.error.nameNotEmpty);
        }

        if (0 === schemaVersion.length) {
          throw new BadRequestException(ResponseMessages.schema.error.versionNotEmpty);
        }

        const schemaVersionIndexOf = -1;

        if (isNaN(parseFloat(schemaVersion)) || schemaVersion.toString().indexOf('.') === schemaVersionIndexOf) {
          throw new NotAcceptableException(ResponseMessages.schema.error.invalidVersion);
        }
        return await this.requestIndySchemaEndorsement(
          schemaPayload as IRequestIndySchemaEndorsement,
          orgId,
          ecosystemId,
          user.id,
          endorse
        );
      } else if (type === SchemaTypeEnum.JSON) {
        const { schemaName, schemaType } = schemaPayload as IRequestW3CSchemaEndorsement;
        const ledgerAndNetworkDetails = await checkDidLedgerAndNetwork(schemaType, agentDetails.orgDid);
        if (!ledgerAndNetworkDetails) {
          throw new BadRequestException(ResponseMessages.schema.error.orgDidAndSchemaType, {
            cause: new Error(),
            description: ResponseMessages.errorMessages.badRequest
          });
        }
        isSchemaExist = await this._schemaExist(schemaName);

        if (0 !== isSchemaExist.length) {
          throw new ConflictException(ResponseMessages.ecosystem.error.schemaNameAlreadyExist);
        }

        return await this.requestW3CSchemaEndorsement(
          schemaPayload as IRequestW3CSchemaEndorsement,
          orgId,
          ecosystemId,
          user.id
        );
      }
    } catch (error) {
      this.logger.error(`In request schema endorsement : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error?.error);
    }
  }

  async requestIndySchemaEndorsement(
    requestSchemaPayload: IRequestIndySchemaEndorsement,
    orgId: string,
    ecosystemId: string,
    userId: string,
    endorse: boolean
  ): Promise<IEndorsementTransaction> {
    try {
      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const [schemaRequestExist, ecosystemOrgAgentDetails, ecosystemLeadAgentDetails, getEcosystemOrgDetailsByOrgId] =
        await Promise.all([
          this.ecosystemRepository.findRecordsByNameAndVersion(
            requestSchemaPayload?.schemaName,
            requestSchemaPayload?.schemaVersion
          ),
          this.ecosystemRepository.getAgentDetails(orgId),
          this.ecosystemRepository.getAgentDetails(getEcosystemLeadDetails.orgId),
          this.ecosystemRepository.getEcosystemOrgDetailsbyId(orgId, ecosystemId)
        ]);

      const existSchema =
        schemaRequestExist?.filter(
          (schema) => schema.status === endorsementTransactionStatus.REQUESTED ||
            schema.status === endorsementTransactionStatus.SIGNED ||
            schema.status === endorsementTransactionStatus.SUBMITED
        ) ?? [];

      if (0 < existSchema.length) {
        throw new ConflictException(ResponseMessages.ecosystem.error.schemaAlreadyExist);
      }

      if (!ecosystemOrgAgentDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.notFound);
      }

      if (!getEcosystemLeadDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemNotFound);
      }

      if (!ecosystemLeadAgentDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      if (!getEcosystemOrgDetailsByOrgId) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemOrgNotFound);
      }

      const orgAgentType = await this.ecosystemRepository.getOrgAgentType(ecosystemOrgAgentDetails.orgAgentTypeId);
      const url = await this.getAgentUrl(
        orgAgentType,
        ecosystemOrgAgentDetails.agentEndPoint,
        endorsementTransactionType.SCHEMA,
        ecosystemOrgAgentDetails.tenantId
      );
      const attributeArray = requestSchemaPayload.attributes.map((item) => item.attributeName);

      const schemaTransactionPayload = {
        endorserDid: ecosystemLeadAgentDetails.orgDid.trim(),
        endorse,
        attributes: attributeArray,
        version: String(requestSchemaPayload.schemaVersion),
        name: requestSchemaPayload.schemaName.trim(),
        issuerId: ecosystemOrgAgentDetails.orgDid.trim()
      };

      const schemaTransactionRequest: SchemaMessage = await this._requestSchemaEndorsement(
        schemaTransactionPayload,
        url,
        orgId
      );

      const schemaTransactionResponse = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        authorDid: ecosystemOrgAgentDetails.orgDid,
        requestPayload: schemaTransactionRequest.message.schemaState.schemaRequest,
        status: endorsementTransactionStatus.REQUESTED,
        ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id,
        userId
      };

      if ('failed' === schemaTransactionRequest.message.schemaState.state) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.requestSchemaTransaction);
      }

      const storeTransaction = await this.ecosystemRepository.storeTransactionRequest(
        schemaTransactionResponse,
        requestSchemaPayload,
        endorsementTransactionType.SCHEMA
      );

      await this.removeEndorsementTransactionFields(storeTransaction);

      return storeTransaction;
    } catch (error) {
      this.logger.error(`In request indy schema endorsement : ${JSON.stringify(error)}`);
      throw new RpcException(error ? error.response : error);
    }
  }

  async requestW3CSchemaEndorsement(
    requestSchemaPayload: IRequestW3CSchemaEndorsement,
    orgId: string,
    ecosystemId: string,
    userId: string
  ): Promise<IEndorsementTransaction> {
    try {
      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const [
        schemaRequestExist,
        ecosystemMemberOrgAgentDetails,
        ecosystemLeadAgentDetails,
        getEcosystemOrgDetailsByOrgId
      ] = await Promise.all([
        this.ecosystemRepository.findSchemaRecordsBySchemaName(requestSchemaPayload?.schemaName),
        this.ecosystemRepository.getAgentDetails(orgId),
        this.ecosystemRepository.getAgentDetails(getEcosystemLeadDetails.orgId),
        this.ecosystemRepository.getEcosystemOrgDetailsbyId(orgId, ecosystemId)
      ]);

      const existSchema =
        schemaRequestExist?.filter(
          (schema) => schema.status === endorsementTransactionStatus.REQUESTED ||
            schema.status === endorsementTransactionStatus.SUBMITED
        ) ?? [];

      if (0 < existSchema.length) {
        throw new ConflictException(ResponseMessages.ecosystem.error.schemaNameAlreadyExist);
      }

      if (!ecosystemMemberOrgAgentDetails) {
        throw new InternalServerErrorException('Error in fetching agent details');
      }

      const w3cSchemaTransactionResponse = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        authorDid: ecosystemMemberOrgAgentDetails.orgDid,
        requestPayload: JSON.stringify(requestSchemaPayload),
        status: endorsementTransactionStatus.REQUESTED,
        ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id,
        userId
      };

      const storeTransaction = await this.ecosystemRepository.storeTransactionRequest(
        w3cSchemaTransactionResponse,
        requestSchemaPayload,
        endorsementTransactionType.W3C_SCHEMA
      );
      await this.removeEndorsementTransactionFields(storeTransaction);

      return storeTransaction;
    } catch (error) {
      this.logger.error(`In request w3c schema endorsement: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _schemaExist(schemaName: string, version?: string): Promise<string> {
    const pattern = { cmd: 'schema-exist' };
    const payload = { schemaName, version };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  async requestCredDeffEndorsement(
    requestCredDefPayload: RequestCredDeffEndorsement,
    orgId: string,
    ecosystemId: string
  ): Promise<IEndorsementTransaction> {
    try {
      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const [
        credDefRequestExist,
        ecosystemMemberDetails,
        platformConfig,
        ecosystemLeadAgentDetails,
        getEcosystemOrgDetailsByOrgId
      ] = await Promise.all([
        this.ecosystemRepository.findRecordsByCredDefTag(requestCredDefPayload?.tag),
        this.ecosystemRepository.getAgentDetails(orgId),
        this.ecosystemRepository.getPlatformConfigDetails(),
        this.ecosystemRepository.getAgentDetails(getEcosystemLeadDetails.orgId),
        this.ecosystemRepository.getEcosystemOrgDetailsbyId(orgId, ecosystemId)
      ]);

      const existsCredDef =
        credDefRequestExist?.filter(
          (tag) => tag.status === endorsementTransactionStatus.REQUESTED ||
            tag.status === endorsementTransactionStatus.SIGNED ||
            tag.status === endorsementTransactionStatus.SUBMITED
        ) ?? [];

      if (0 < existsCredDef.length) {
        throw new ConflictException(ResponseMessages.ecosystem.error.credDefAlreadyExist);
      }

      if (!ecosystemMemberDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.notFound);
      }

      if (!platformConfig) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.platformConfigNotFound);
      }

      if (!getEcosystemLeadDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemNotFound);
      }

      if (!ecosystemLeadAgentDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      if (!getEcosystemOrgDetailsByOrgId) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemOrgNotFound);
      }

      let requestCredDefBody;
      const credDefData = credDefRequestExist?.filter((tag) => tag.status === endorsementTransactionStatus.DECLINED);
      if (0 < credDefData.length) {
        let schemaTransactionResponse;
        credDefRequestExist.forEach((tag) => {
          requestCredDefBody = tag.requestBody;
          schemaTransactionResponse = {
            endorserDid: ecosystemLeadAgentDetails.orgDid,
            authorDid: ecosystemMemberDetails.orgDid,
            requestPayload: tag.requestPayload,
            status: endorsementTransactionStatus.REQUESTED,
            ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id,
            userId: requestCredDefPayload.userId
          };
        });
        const storeTransaction = await this.ecosystemRepository.storeTransactionRequest(
          schemaTransactionResponse,
          requestCredDefBody,
          endorsementTransactionType.CREDENTIAL_DEFINITION
        );

        // To return selective response
        await this.removeEndorsementTransactionFields(storeTransaction);

        await new Promise((resolve) => setTimeout(resolve, 5000));
        return storeTransaction;
      } else {
        const orgAgentType = await this.ecosystemRepository.getOrgAgentType(ecosystemMemberDetails.orgAgentTypeId);
        const url = await this.getAgentUrl(
          orgAgentType,
          ecosystemMemberDetails.agentEndPoint,
          endorsementTransactionType.CREDENTIAL_DEFINITION,
          ecosystemMemberDetails.tenantId
        );
        const credDefTransactionPayload = {
          endorserDid: ecosystemLeadAgentDetails.orgDid,
          endorse: requestCredDefPayload.endorse,
          tag: requestCredDefPayload.tag,
          schemaId: requestCredDefPayload.schemaId,
          issuerId: ecosystemMemberDetails.orgDid
        };

        const credDefTransactionRequest: CredDefMessage = await this._requestCredDeffEndorsement(
          credDefTransactionPayload,
          url,
          orgId
        );

        if ('failed' === credDefTransactionRequest.message.credentialDefinitionState.state) {
          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.requestCredDefTransaction);
        }

        const requestBody = credDefTransactionRequest.message.credentialDefinitionState.credentialDefinition;

        if (!requestBody) {
          throw new NotFoundException(ResponseMessages.ecosystem.error.credentialDefinitionNotFound);
        }

        requestCredDefPayload['credentialDefinition'] = requestBody;
        const schemaTransactionResponse = {
          endorserDid: ecosystemLeadAgentDetails.orgDid,
          authorDid: ecosystemMemberDetails.orgDid,
          requestPayload: credDefTransactionRequest.message.credentialDefinitionState.credentialDefinitionRequest,
          status: endorsementTransactionStatus.REQUESTED,
          ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id,
          userId: requestCredDefPayload.userId
        };

        const storeTransaction = await this.ecosystemRepository.storeTransactionRequest(
          schemaTransactionResponse,
          requestCredDefPayload,
          endorsementTransactionType.CREDENTIAL_DEFINITION
        );

        // To return selective response
        await this.removeEndorsementTransactionFields(storeTransaction);

        return storeTransaction;
      }
    } catch (error) {
      this.logger.error(`In request cred-def endorsement: ${JSON.stringify(error)}`);
      const errorObj = error?.status?.message?.error;
      if (errorObj) {
        throw new RpcException({
          message: errorObj?.reason ? errorObj?.reason : errorObj,
          statusCode: error?.status?.code
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async getInvitationsByEcosystemId(payload: FetchInvitationsPayload): Promise<IEcosystemInvitation> {
    try {
      const { ecosystemId, pageNumber, pageSize, search } = payload;
      const ecosystemInvitations = await this.ecosystemRepository.getInvitationsByEcosystemId(
        ecosystemId,
        pageNumber,
        pageSize,
        search
      );
      return ecosystemInvitations;
    } catch (error) {
      this.logger.error(`In getInvitationsByEcosystemId : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _requestSchemaEndorsement(requestSchemaPayload: object, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-schema-endorsement-request' };
    const payload = { requestSchemaPayload, url, orgId };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _requestCredDeffEndorsement(requestSchemaPayload: object, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-credDef-endorsement-request' };
    const payload = { requestSchemaPayload, url, orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  async signTransaction(endorsementId: string, ecosystemId:string): Promise<object> {
    try {
      const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);

      const checkEndorsementRequestIsExists = await this.ecosystemRepository.getTransactionDetailsByEndorsementId(
        endorsementId
      );

      if (checkEndorsementRequestIsExists?.status === endorsementTransactionStatus.SIGNED) {
        throw new ConflictException(ResponseMessages.ecosystem.error.transactionAlreadySigned);
      } else if (checkEndorsementRequestIsExists?.status === endorsementTransactionStatus.SUBMITED) {
        throw new ConflictException(ResponseMessages.ecosystem.error.transactionSubmitted);
      }

      if (!ecosystemDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemNotFound);
      }

      const [endorsementTransactionPayload, ecosystemLeadDetails, platformConfig] = await Promise.all([
        this.ecosystemRepository.getEndorsementTransactionById(endorsementId, endorsementTransactionStatus.REQUESTED),
        this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId),
        this.ecosystemRepository.getPlatformConfigDetails()
      ]);

      if (
        endorsementTransactionPayload &&
        endorsementTransactionPayload?.type === endorsementTransactionType.W3C_SCHEMA
      ) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.signTransactionNotApplicable);
      }

      if (!endorsementTransactionPayload) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.invalidTransaction);
      }

      if (!ecosystemLeadDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      if (!platformConfig) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.platformConfigNotFound);
      }

      const ecosystemLeadAgentDetails = await this.ecosystemRepository.getAgentDetails(ecosystemLeadDetails.orgId);

      if (!ecosystemLeadAgentDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      const orgAgentType = await this.ecosystemRepository.getOrgAgentType(ecosystemLeadAgentDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(
        orgAgentType,
        ecosystemLeadAgentDetails.agentEndPoint,
        endorsementTransactionType.SIGN,
        ecosystemLeadAgentDetails?.tenantId
      );
      const jsonString = endorsementTransactionPayload.requestPayload.toString();
      const payload = {
        transaction: jsonString,
        endorserDid: endorsementTransactionPayload.endorserDid
      };
      const schemaTransactionRequest: SignedTransactionMessage = await this._signTransaction(
        payload,
        url,
        ecosystemLeadDetails.orgId
      );

      if (!schemaTransactionRequest) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.signRequestError);
      }

      const updateSignedTransaction = await this.ecosystemRepository.updateTransactionDetails(
        endorsementId,
        schemaTransactionRequest.message.signedTransaction
      );

      if (!updateSignedTransaction) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.updateTransactionError);
      }

      if (updateSignedTransaction && true === ecosystemDetails.autoEndorsement) {
        const submitTxn = await this.submitTransaction({
          endorsementId,
          ecosystemId,
          ecosystemLeadAgentEndPoint: ecosystemLeadAgentDetails.agentEndPoint,
          orgId: ecosystemLeadDetails.orgId
        });
        if (!submitTxn) {
          await this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.REQUESTED);
          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
        }
        const finalResponse = {
          autoEndorsement: ecosystemDetails.autoEndorsement,
          submitTxn
        };
        return finalResponse;
      }

      await this.removeEndorsementTransactionFields(updateSignedTransaction);
      return updateSignedTransaction;
    } catch (error) {
      this.logger.error(`In sign transaction: ${JSON.stringify(error)}`);
      const errorObject = error?.error;
      if (errorObject) {
        throw new RpcException({
          statusCode: errorObject?.error?.error?.message?.statusCode,
          message: 'Error in transaction process',
          error: errorObject?.error?.error?.message?.error?.message
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  /**
   *
   * @returns Ecosystem members list
   */

  async getEcosystemMembers(payload: EcosystemMembersPayload): Promise<object> {
    try {
      const { ecosystemId, pageNumber, pageSize, search, sortBy, sortField } = payload;
      const getEcosystemMember = await this.ecosystemRepository.findEcosystemMembers(
        ecosystemId,
        pageNumber,
        pageSize,
        search,
        sortBy,
        sortField
      );

      const ecosystemMemberResponse = {
        totalItems: getEcosystemMember[1],
        hasNextPage: payload.pageSize * payload.pageNumber < getEcosystemMember[1],
        hasPreviousPage: 1 < payload.pageNumber,
        nextPage: Number(payload.pageNumber) + 1,
        previousPage: payload.pageNumber - 1,
        lastPage: Math.ceil(getEcosystemMember[1] / payload.pageSize),
        data: getEcosystemMember[0]
      };

      return ecosystemMemberResponse;
    } catch (error) {
      this.logger.error(`In getEcosystemMembers: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  
  async deleteEcosystemInvitations (invitationId: string): Promise<object> {
    try {  
      return await this.ecosystemRepository.deleteInvitations(invitationId);
      
    } catch (error) {
      this.logger.error(`In error deleteEcosystemInvitation: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
  /**
   * Description: Store shortening URL
   * @param signEndorsementPayload
   * @param url
   * @returns sign message
   */
  async _signTransaction(signEndorsementPayload: object, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-sign-transaction' };
    const payload = { signEndorsementPayload, url, orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  // eslint-disable-next-line camelcase
  async getEcosystemMemberDetails(endorsementTransactionPayload): Promise<org_agents> {
    const orgId = endorsementTransactionPayload.ecosystemOrgs.orgId;
    return this.ecosystemRepository.getAgentDetails(orgId);
  }

  // eslint-disable-next-line camelcase
  async getEcosystemLeadAgentDetails(ecosystemId: string): Promise<org_agents> {
    const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);
    return this.ecosystemRepository.getAgentDetails(getEcosystemLeadDetails.orgId);
  }

  // eslint-disable-next-line camelcase
  async getPlatformConfig(): Promise<platform_config> {
    return this.ecosystemRepository.getPlatformConfigDetails();
  }

  async submitTransactionPayload(
    endorsementTransactionPayload,
    ecosystemMemberDetails,
    ecosystemLeadAgentDetails
  ): Promise<submitTransactionPayload> {
    const parsedRequestPayload = JSON.parse(endorsementTransactionPayload.responsePayload);
    const jsonString = endorsementTransactionPayload.responsePayload.toString();
    const payload: submitTransactionPayload = {
      endorsedTransaction: jsonString,
      endorserDid: ecosystemLeadAgentDetails.orgDid
    };

    switch (endorsementTransactionPayload.type) {
      case endorsementTransactionType.SCHEMA:
        payload.schema = {
          attributes: parsedRequestPayload.operation.data.attr_names,
          version: parsedRequestPayload.operation.data.version,
          name: parsedRequestPayload.operation.data.name,
          issuerId: ecosystemMemberDetails.orgDid
        };
        break;

      case endorsementTransactionType.CREDENTIAL_DEFINITION:
        payload.credentialDefinition = {
          tag: parsedRequestPayload.operation.tag,
          issuerId: ecosystemMemberDetails.orgDid,
          schemaId: endorsementTransactionPayload.requestBody.credentialDefinition['schemaId'],
          type: endorsementTransactionPayload.requestBody.credentialDefinition['type'],
          value: endorsementTransactionPayload.requestBody.credentialDefinition['value']
        };
        break;
      default:
        throw new Error('Unsupported endorsement transaction type');
    }

    return payload;
  }

  async handleSchemaSubmission(
    endorsementTransactionPayload,
    ecosystemMemberDetails,
    submitTransactionRequest
  ): Promise<schema> {
    const regex = /[^:]+$/;
    const match = ecosystemMemberDetails.orgDid.match(regex);
    let extractedDidValue;

    if (match) {
      // eslint-disable-next-line prefer-destructuring
      extractedDidValue = match[0];
    }
    const saveSchemaPayload: SaveSchema = {
      name: endorsementTransactionPayload.requestBody['schemaName'],
      version: endorsementTransactionPayload.requestBody['schemaVersion'],
      attributes: JSON.stringify(endorsementTransactionPayload.requestBody['attributes']),
      schemaLedgerId: submitTransactionRequest['message'].schemaId,
      issuerId: ecosystemMemberDetails.orgDid,
      createdBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      lastChangedBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      publisherDid: extractedDidValue,
      orgId: endorsementTransactionPayload.ecosystemOrgs.orgId,
      ledgerId: ecosystemMemberDetails.ledgerId,
      type: SchemaType.INDY
    };
    const saveSchemaDetails = await this.ecosystemRepository.saveSchema(saveSchemaPayload);
    if (!saveSchemaDetails) {
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.saveSchema);
    }
    return saveSchemaDetails;
  }

  // eslint-disable-next-line camelcase
  async handleCredDefSubmission(
    endorsementTransactionPayload,
    ecosystemMemberDetails,
    submitTransactionRequest
    // eslint-disable-next-line camelcase
  ): Promise<credential_definition> {
    const schemaDetails = await this.ecosystemRepository.getSchemaDetailsById(
      endorsementTransactionPayload.requestBody['schemaId']
    );

    if (!schemaDetails) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.schemaNotFound);
    }

    const saveCredentialDefinition: saveCredDef = {
      schemaLedgerId: endorsementTransactionPayload.requestBody['schemaId'],
      tag: endorsementTransactionPayload.requestBody['tag'],
      credentialDefinitionId: submitTransactionRequest['message'].credentialDefinitionId,
      revocable: false,
      createdBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      lastChangedBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      orgId: ecosystemMemberDetails.orgId,
      schemaId: schemaDetails.id
    };

    const saveCredDefDetails = await this.ecosystemRepository.saveCredDef(saveCredentialDefinition);
    if (!saveCredDefDetails) {
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.saveCredDef);
    }
    return saveCredDefDetails;
  }

  async updateTransactionStatus(endorsementId: string): Promise<object> {
    return this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.SUBMITED);
  }

  async submitTransaction(transactionPayload: ITransactionData): Promise<{txnPayload: object, responseMessage: string}> {
    try {
      const { endorsementId, ecosystemId, ecosystemLeadAgentEndPoint, orgId } = transactionPayload;
      const checkEndorsementRequestIsSubmitted = await this.ecosystemRepository.getEndorsementTransactionById(
        endorsementId,
        endorsementTransactionStatus.SUBMITED
      );

      if (checkEndorsementRequestIsSubmitted) {
        throw new ConflictException(ResponseMessages.ecosystem.error.transactionSubmitted);
      }

      const endorsementTransactionPayload = await this.ecosystemRepository.getEndorsementTransactionById(
        endorsementId,
        endorsementTransactionStatus.SIGNED
      );

      if (!endorsementTransactionPayload) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.transactionNotSigned);
      }

      const ecosystemMemberDetails = await this.getEcosystemMemberDetails(endorsementTransactionPayload);
      const ecosystemLeadAgentDetails = await this.getEcosystemLeadAgentDetails(ecosystemId);
      const agentEndPoint = ecosystemLeadAgentEndPoint
        ? ecosystemLeadAgentEndPoint
        : ecosystemMemberDetails.agentEndPoint;

      const orgAgentType = await this.ecosystemRepository.getOrgAgentType(ecosystemMemberDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(
        orgAgentType,
        agentEndPoint,
        endorsementTransactionType.SUBMIT,
        ecosystemMemberDetails?.tenantId
      );
      const payload = await this.submitTransactionPayload(
        endorsementTransactionPayload,
        ecosystemMemberDetails,
        ecosystemLeadAgentDetails
      );

      if (endorsementTransactionPayload.type === endorsementTransactionType.SCHEMA) {
        const isSchemaExists = await this.ecosystemRepository.schemaExist(payload.schema.name, payload.schema.version);

        if (0 !== isSchemaExists.length) {
          this.logger.error(ResponseMessages.ecosystem.error.schemaAlreadyExist);
          throw new ConflictException(ResponseMessages.ecosystem.error.schemaAlreadyExist, {
            cause: new Error(),
            description: ResponseMessages.errorMessages.conflict
          });
        }
      }

      const submitTransactionRequest = await this._submitTransaction(payload, url, orgId);

      if ('failed' === submitTransactionRequest['message'].state) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
      }

      await this.updateTransactionStatus(endorsementId);

      if (endorsementTransactionPayload.type === endorsementTransactionType.SCHEMA) {
        const updateSchemaId = await this._updateResourceId(
          endorsementId,
          endorsementTransactionType.SCHEMA,
          submitTransactionRequest
        );

        if (!updateSchemaId) {
          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.updateSchemaId);
        }

        const response = this.handleSchemaSubmission(
          endorsementTransactionPayload,
          ecosystemMemberDetails,
          submitTransactionRequest
        );

        return response;
      } else if (endorsementTransactionPayload.type === endorsementTransactionType.CREDENTIAL_DEFINITION) {
        if ('undefined' === submitTransactionRequest['message'].credentialDefinitionId.split(':')[3]) {
          const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);
          if (true === ecosystemDetails.autoEndorsement) {
            await this.ecosystemRepository.updateTransactionStatus(
              endorsementId,
              endorsementTransactionStatus.REQUESTED
            );
          } else {
            await this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.SIGNED);
          }

          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
        }
        const updateCredDefId = await this._updateResourceId(
          endorsementId,
          endorsementTransactionType.CREDENTIAL_DEFINITION,
          submitTransactionRequest
        );

        if (!updateCredDefId) {
          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.updateCredDefId);
        }
        return this.handleCredDefSubmission(
          endorsementTransactionPayload,
          ecosystemMemberDetails,
          submitTransactionRequest
        );
      }


        return this.handleCredDefSubmission(endorsementTransactionPayload, ecosystemMemberDetails, submitTransactionRequest);
      }
    } catch (error) {
      this.logger.error(`In submit Indy transaction: ${JSON.stringify(error)}`);
      this.handleException(error);
    }
  }

  async submitW3CTransaction(transactionPayload: ITransactionData): Promise<object> {
    try {
      const { endorsementId } = transactionPayload;
      const endorsementTransactionPayload = await this.ecosystemRepository.getEndorsementTransactionById(
        endorsementId,
        endorsementTransactionStatus.REQUESTED
      );

      if (!endorsementTransactionPayload) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.transactionNotRequested);
      }

      const w3cEndorsementTransactionPayload = await this.ecosystemRepository.getEndorsementTransactionByIdAndType(
        endorsementId,
        endorsementTransactionType.W3C_SCHEMA
      );

      const schemaPayload = {
        schemaDetails: {
          type: SchemaTypeEnum.JSON,
          schemaPayload: {
            schemaName: w3cEndorsementTransactionPayload?.requestBody?.['schemaName'],
            attributes: w3cEndorsementTransactionPayload?.requestBody?.['attributes'],
            schemaType: w3cEndorsementTransactionPayload?.requestBody?.['schemaType'],
            description: w3cEndorsementTransactionPayload?.requestBody?.['description']
          }
        },
        orgId: w3cEndorsementTransactionPayload?.['ecosystemOrgs']?.orgId,
        user: transactionPayload?.user
      };

      const w3cSchemaResponse = await this._createW3CSchema(schemaPayload);

      const resourceId = w3cSchemaResponse?.['schemaUrl'];

      await this.ecosystemRepository.updateResourse(endorsementId, resourceId);

      await this.updateTransactionStatus(endorsementId);

      return w3cSchemaResponse;
    } catch (error) {
      this.logger.error(`In submit w3c transaction: ${JSON.stringify(error)}`);
      this.handleException(error);
    }
  }

  private handleException(error): void {
    if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
      throw new RpcException({
        message: error?.status?.message?.error?.reason
          ? error?.status?.message?.error?.reason
          : error?.status?.message?.error,
        statusCode: error?.status?.code
      });
    } else {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _createW3CSchema(payload: IschemaPayload): Promise<object> {
    const pattern = { cmd: 'create-schema' };

    const w3cSchemaData = await this.ecosystemServiceProxy
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
    return w3cSchemaData;
  }

  /**
   * Description: Store shortening URL
   * @param signEndorsementPayload
   * @param url
   * @returns sign message
   */
  async _submitTransaction(submitEndorsementPayload: object, url: string, orgId: string): Promise<object> {
    const pattern = { cmd: 'agent-submit-transaction' };
    const payload = { submitEndorsementPayload, url, orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(` agent-submit-transaction catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          message: error.message,
          error: error.error
        },
        error.status
      );
    }
  }

  async _updateResourceId(
    endorsementId: string,
    transactionType: endorsementTransactionType,
    transactionDetails: object
  ): Promise<object> {
    try {
      // eslint-disable-next-line prefer-destructuring
      const message = transactionDetails['message'];
      if (!message) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidMessage);
      }

      const resourceId =
        message[transactionType === endorsementTransactionType.SCHEMA ? 'schemaId' : 'credentialDefinitionId'];

      if (!resourceId) {
        throw new Error(
          `${ResponseMessages.ecosystem.error.invalidTransactionMessage} Missing "${
            transactionType === endorsementTransactionType.SCHEMA ? 'schemaId' : 'credentialDefinitionId'
          }" property.`
        );
      }

      return await this.ecosystemRepository.updateResourse(endorsementId, resourceId);
    } catch (error) {
      this.logger.error(`Error updating resource ID: ${JSON.stringify(error)}`);
    }
  }

  async getAgentUrl(orgAgentTypeId: string, agentEndPoint: string, type: string, tenantId?: string): Promise<string> {
    try {
      let url;

      if (orgAgentTypeId === OrgAgentType.DEDICATED) {
        if (type === endorsementTransactionType.SCHEMA) {
          url = `${agentEndPoint}${CommonConstants.URL_SCHM_CREATE_SCHEMA}`;
        } else if (type === endorsementTransactionType.W3C_SCHEMA) {
          url = `${agentEndPoint}${CommonConstants.DEDICATED_CREATE_POLYGON_W3C_SCHEMA}`;
        } else if (type === endorsementTransactionType.CREDENTIAL_DEFINITION) {
          url = `${agentEndPoint}${CommonConstants.URL_SCHM_CREATE_CRED_DEF}`;
        } else if (type === endorsementTransactionType.SIGN) {
          url = `${agentEndPoint}${CommonConstants.SIGN_TRANSACTION}`;
        } else if (type === endorsementTransactionType.SUBMIT) {
          url = `${agentEndPoint}${CommonConstants.SUBMIT_TRANSACTION}`;
        }
      } else if (orgAgentTypeId === OrgAgentType.SHARED) {
        // TODO
        if (tenantId !== undefined) {
          if (type === endorsementTransactionType.SCHEMA) {
            url = `${agentEndPoint}${CommonConstants.TRANSACTION_MULTITENANT_SCHEMA}`.replace('#', tenantId);
          } else if (type === endorsementTransactionType.W3C_SCHEMA) {
            url = `${agentEndPoint}${CommonConstants.SHARED_CREATE_POLYGON_W3C_SCHEMA}${tenantId}`;
          } else if (type === endorsementTransactionType.CREDENTIAL_DEFINITION) {
            url = `${agentEndPoint}${CommonConstants.TRANSACTION_MULTITENANT_CRED_DEF}`.replace('#', tenantId);
          } else if (type === endorsementTransactionType.SIGN) {
            url = `${agentEndPoint}${CommonConstants.TRANSACTION_MULTITENANT_SIGN}`.replace('#', tenantId);
          } else if (type === endorsementTransactionType.SUBMIT) {
            url = `${agentEndPoint}${CommonConstants.TRANSACTION_MULTITENANT_SUMBIT}`.replace('#', tenantId);
          } else {
            throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidAgentUrl);
          }
        } else {
          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidAgentUrl);
        }
      } else {
        throw new NotFoundException(ResponseMessages.connection.error.agentUrlNotFound);
      }

      return url;
    } catch (error) {
      this.logger.error(`Error in get agent url: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async fetchEcosystemOrg(payload: { ecosystemId: string; orgId: string }): Promise<object> {
    const isEcosystemEnabled = await this.checkEcosystemEnableFlag();

    if (!isEcosystemEnabled) {
      throw new ForbiddenException(ResponseMessages.ecosystem.error.ecosystemNotEnabled);
    }

    return this.ecosystemRepository.fetchEcosystemOrg(payload);
  }

  /**
   *
   * @returns Returns ecosystem flag from settings
   */
  async checkEcosystemEnableFlag(): Promise<boolean> {
    const ecosystemDetails = await this.prisma.ecosystem_config.findFirst({
      where: {
        key: 'enableEcosystem'
      }
    });

    if ('true' === ecosystemDetails.value) {
      return true;
    }

    return false;
  }

  async getEndorsementTransactions(payload: GetEndorsementsPayload): Promise<object> {
    const { ecosystemId, orgId, pageNumber, pageSize, search, type } = payload;
    try {
      const queryEcoOrgs = {
        ecosystemId,
        orgId
      };

      const query = {
        ecosystemOrgs: {
          ecosystemId
        },
        OR: [
          { status: { contains: search, mode: 'insensitive' } },
          { authorDid: { contains: search, mode: 'insensitive' } }
        ]
      };

      const ecosystemOrgData = await this.ecosystemRepository.fetchEcosystemOrg(queryEcoOrgs);

      if (ecosystemOrgData['ecosystemRole']['name'] !== EcosystemRoles.ECOSYSTEM_LEAD) {
        query.ecosystemOrgs['orgId'] = orgId;
      }

      if (type) {
        query['type'] = type;
      }

      return await this.ecosystemRepository.getEndorsementsWithPagination(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`In error getEndorsementTransactions: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getAllEcosystemSchemas(ecosystemSchemas: GetAllSchemaList): Promise<ISchemasResponse> {
    try {
      const response = await this.ecosystemRepository.getAllEcosystemSchemasDetails(ecosystemSchemas);
      const schemasDetails = response?.schemasResult.map((schemaAttributeItem) => {
        const attributes = JSON.parse(schemaAttributeItem.attributes);
        return { ...schemaAttributeItem, attributes };
      });

      const schemasResponse: ISchemasResponse = {
        schemasCount: response.schemasCount,
        schemasResult: schemasDetails
      };

      return schemasResponse;
    } catch (error) {
      this.logger.error(`In error fetching all ecosystem schemas: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   * @returns EndorsementTransaction Status message
   */

  async autoSignAndSubmitTransaction(): Promise<object> {
    try {
      return await this.ecosystemRepository.updateAutoSignAndSubmitTransaction();
    } catch (error) {
      this.logger.error(`error in decline endorsement request: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param ecosystemId
   * @param endorsementId
   * @param orgId
   * @returns EndorsementTransactionRequest Status message
   */

  async declineEndorsementRequestByLead(ecosystemId: string, endorsementId: string): Promise<object> {
    try {
      const declineResponse = await this.ecosystemRepository.updateEndorsementRequestStatus(ecosystemId, endorsementId);

      // To return selective response
      this.removeEndorsementTransactionFields(declineResponse);

      return declineResponse;
    } catch (error) {
      this.logger.error(`error in decline endorsement request: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getOrgAgentApiKey(orgId: string): Promise<string> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException(
        {
          status: error.status,
          error: error.message
        },
        error.status
      );
    }
  }

  async sendMailToEcosystemMembers(email: string, orgName: string, ecosystemName: string): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new DeleteEcosystemMemberTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `Removal of participation of “${orgName}” from ${ecosystemName}`;

    emailData.emailHtml = urlEmailTemplate.sendDeleteMemberEmailTemplate(email, orgName, ecosystemName);

    const isEmailSent = await sendEmail(emailData);

    return isEmailSent;
  }

  async _getOrgData(orgId: string): Promise<IOrgData> {
    const pattern = { cmd: 'get-organization-details' };
    const payload = { orgId };
    const orgData = await this.ecosystemServiceProxy
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
    return orgData;
  }

  async _getUsersDetails(userId: string): Promise<string> {
    const pattern = { cmd: 'get-user-details-by-userId' };
    const payload = { userId };
    const userData = await this.ecosystemServiceProxy
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

  async deleteOrgFromEcosystem(orgId: string, userDetails: user): Promise<IEcosystemDataDeletionResults> {
    try {
      const getEcosystems = await this.ecosystemRepository.getEcosystemsByOrgId(orgId);

      const ecosystemLeadRoleOrgs = [];
      const ecosystemMemberRoleOrgs = [];

      getEcosystems.forEach((ecosystem) => {
        ecosystem.ecosystemOrgs.forEach((org) => {
          if (EcosystemRoles.ECOSYSTEM_LEAD === org?.ecosystemRole?.name) {
            ecosystemLeadRoleOrgs.push(org);
          } else if (EcosystemRoles.ECOSYSTEM_MEMBER === org?.ecosystemRole?.name) {
            ecosystemMemberRoleOrgs.push(org);
          }
        });
      });

      const getEcosystemLeadRoleOrgsIds = ecosystemLeadRoleOrgs?.map((org) => org?.orgId);
      const getEcosystemMemberRoleOrgIds = ecosystemMemberRoleOrgs?.map((org) => org?.orgId);

      if (getEcosystemLeadRoleOrgsIds?.includes(orgId)) {
        throw new BadRequestException(ResponseMessages.ecosystem.error.notAbleToDeleteEcosystem);
      }

      let ecosystemId;
      let getEcosystemDetails;
      let getEcosystemLeadDetails;

      getEcosystems.forEach((ecosystem) => {
        ecosystem.ecosystemOrgs.forEach((org) => {
          if (org.ecosystemRole && org.ecosystemRole.name === EcosystemRoles.ECOSYSTEM_LEAD) {
            ecosystemId = org?.ecosystemId;
          }
        });
      });

      if (ecosystemId) {
        getEcosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);
        getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);
      } else {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemNotExists);
      }

      const getLeadUserId = getEcosystemLeadDetails?.createdBy;

      const getLeadEmailId = await this._getUsersDetails(getLeadUserId);

      const getOrgName = await this._getOrgData(orgId);

      let deleteEcosystems;

      if (getEcosystemMemberRoleOrgIds?.includes(orgId)) {
        deleteEcosystems = await this.ecosystemRepository.deleteMemberOrgFromEcosystem(orgId);
        await this.ecosystemRepository.deleteEcosystemInvitations(orgId);
        await this.sendMailToEcosystemMembers(getLeadEmailId, getOrgName?.['name'], getEcosystemDetails?.name);
      }

      const ecosystemDataCount = {
        deletedEndorsementTransactionsCount: deleteEcosystems?.deleteEndorsementTransactions?.count
      };

      const deletedEcosystemsData = {
        deletedEcosystemCount: deleteEcosystems?.deletedEcosystemOrgs?.count,
        deletedEcosystemDataCount: ecosystemDataCount
      };

      await this.userActivityRepository._orgDeletedActivity(
        orgId,
        userDetails,
        deletedEcosystemsData,
        RecordType.ECOSYSTEM_MEMBER
      );
      return deleteEcosystems;
    } catch (error) {
      this.logger.error(`In delete ecosystems: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
}