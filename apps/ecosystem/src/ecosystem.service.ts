// eslint-disable-next-line camelcase
import { ConflictException, ForbiddenException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EcosystemRepository } from './ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { BulkSendInvitationDto } from '../dtos/send-invitation.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaService } from '@credebl/prisma-service';
import { EcosystemInviteTemplate } from '../templates/EcosystemInviteTemplate';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { AcceptRejectEcosystemInvitationDto } from '../dtos/accept-reject-ecosysteminvitation.dto';
import { EcosystemConfigSettings, Invitation, OrgAgentType } from '@credebl/enum/enum';
import { EcosystemOrgStatus, EcosystemRoles, endorsementTransactionStatus, endorsementTransactionType } from '../enums/ecosystem.enum';
import { FetchInvitationsPayload } from '../interfaces/invitations.interface';
import { EcosystemMembersPayload } from '../interfaces/ecosystemMembers.interface';
import { CreateEcosystem, CredDefMessage, RequestCredDeffEndorsement, RequestSchemaEndorsement, SaveSchema, SchemaMessage, SignedTransactionMessage, saveCredDef, submitTransactionPayload } from '../interfaces/ecosystem.interfaces';
import { GetAllSchemaList, GetEndorsementsPayload } from '../interfaces/endorsements.interface';
import { CommonConstants } from '@credebl/common/common.constant';
// eslint-disable-next-line camelcase
import { credential_definition, org_agents, platform_config, schema, user } from '@prisma/client';


@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger,
    private readonly prisma: PrismaService

  ) { }

  /**
   *
   * @param createEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem(createEcosystemDto: CreateEcosystem): Promise<object> {

    const isMultiEcosystemEnabled = await this.ecosystemRepository.getSpecificEcosystemConfig(EcosystemConfigSettings.MULTI_ECOSYSTEM);

    if (isMultiEcosystemEnabled && 'false' === isMultiEcosystemEnabled.value) {
      const ecoOrganizationList = await this.ecosystemRepository.checkEcosystemOrgs(createEcosystemDto.orgId);
      
      for (const organization of ecoOrganizationList) {
        if (organization['ecosystemRole']['name'] === EcosystemRoles.ECOSYSTEM_MEMBER) {
          throw new ConflictException(ResponseMessages.ecosystem.error.ecosystemOrgAlready);
        }
      }
    }   
    const createEcosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto);
    if (!createEcosystem) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.notCreated);
    }
    return createEcosystem;
  }


  /**
  *
  * @param editEcosystemDto
  * @returns
  */

  // eslint-disable-next-line camelcase
  async editEcosystem(editEcosystemDto, ecosystemId): Promise<object> {
    const editOrganization = await this.ecosystemRepository.updateEcosystemById(editEcosystemDto, ecosystemId);
    if (!editOrganization) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
    }
    return editOrganization;
  }

  /**
   *
   *
   * @returns all ecosystem details
   */

  // eslint-disable-next-line camelcase
  async getAllEcosystem(payload: { orgId: string }): Promise<object> {
    const getAllEcosystemDetails = await this.ecosystemRepository.getAllEcosystemDetails(payload.orgId);

    if (!getAllEcosystemDetails) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
    }
    return getAllEcosystemDetails;
  }

  /**
   *
   *
   * @returns ecosystem dashboard details
   */
  async getEcosystemDashboardDetails(ecosystemId: string): Promise<object> {
    try {
      const endorseMemberCount = await this.ecosystemRepository.getEcosystemDashboardDetails(ecosystemId);

      const query = {
        ecosystemId,
        ecosystemRole: {
          name: EcosystemRoles.ECOSYSTEM_LEAD
        }
      };

      const ecosystemDetails = await this.ecosystemRepository.fetchEcosystemOrg(
        query
      );

      const dashboardDetails = {
        ecosystem: ecosystemDetails['ecosystem'],
        membersCount: endorseMemberCount.membersCount,
        endorsementsCount: endorseMemberCount.endorsementsCount,
        ecosystemLead: {
          role: ecosystemDetails['ecosystemRole']['name'],
          orgName: ecosystemDetails['orgName'],
          config: endorseMemberCount.ecosystemConfigData
        }
      };

      return dashboardDetails;
    } catch (error) {
      this.logger.error(`In ecosystem dashboard details : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
    * Description: get an ecosystem invitation 
    * @returns Get sent ecosystem invitation details
    */

  // eslint-disable-next-line camelcase
  async getEcosystemInvitations(userEmail: string, status: string, pageNumber: number, pageSize: number, search: string): Promise<object> {

    try {
      const query = {
        AND: [
          { email: userEmail },
          { status: { contains: search, mode: 'insensitive' } }
        ]
      };

      return await this.ecosystemRepository.getEcosystemInvitationsPagination(query, pageNumber, pageSize);
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
  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: string, userEmail: string): Promise<string> {
    const { invitations, ecosystemId } = bulkInvitationDto;

    try {
      const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);

      for (const invitation of invitations) {
        const { email } = invitation;

        const isUserExist = await this.checkUserExistInPlatform(email);

        const isInvitationExist = await this.checkInvitationExist(email, ecosystemId);
        
        if (!isInvitationExist && userEmail !== invitation.email) {
          await this.ecosystemRepository.createSendInvitation(email, ecosystemId, userId);
          try {
            await this.sendInviteEmailTemplate(email, ecosystemDetails.name, isUserExist);
          } catch (error) {
            throw new InternalServerErrorException(ResponseMessages.user.error.emailSend);
          }
        }
      }
      return ResponseMessages.ecosystem.success.createInvitation;
    } catch (error) {
      this.logger.error(`In send Invitation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
   *
   * @param acceptRejectEcosystemInvitation
   * @param userId
   * @returns Ecosystem invitation status
   */
  async acceptRejectEcosystemInvitations(acceptRejectInvitation: AcceptRejectEcosystemInvitationDto): Promise<string> {
    try {
      const isMultiEcosystemEnabled = await this.ecosystemRepository.getSpecificEcosystemConfig(EcosystemConfigSettings.MULTI_ECOSYSTEM);
      if (isMultiEcosystemEnabled 
        && 'false' === isMultiEcosystemEnabled.value 
        && acceptRejectInvitation.status !== Invitation.REJECTED) {
        const checkOrganization = await this.ecosystemRepository.checkEcosystemOrgs(acceptRejectInvitation.orgId);
        if (0 < checkOrganization.length) {
          throw new ConflictException(ResponseMessages.ecosystem.error.ecosystemOrgAlready);
        };
      } 

      const { orgId, status, invitationId, orgName, orgDid } = acceptRejectInvitation;
      const invitation = await this.ecosystemRepository.getEcosystemInvitationById(invitationId);

      if (!invitation) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.invitationNotFound);
      }

      const updatedInvitation = await this.updateEcosystemInvitation(invitationId, orgId, status);
      if (!updatedInvitation) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.invitationNotUpdate);
      }

      if (status === Invitation.REJECTED) {
        return ResponseMessages.ecosystem.success.invitationReject;
      }

      const ecosystemRole = await this.ecosystemRepository.getEcosystemRole(EcosystemRoles.ECOSYSTEM_MEMBER);
      const updateEcosystemOrgs = await this.updatedEcosystemOrgs(orgId, orgName, orgDid, invitation.ecosystemId, ecosystemRole.id);

      if (!updateEcosystemOrgs) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.orgsNotUpdate);
      }
      return ResponseMessages.ecosystem.success.invitationAccept;

    } catch (error) {
      this.logger.error(`acceptRejectEcosystemInvitations: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async updatedEcosystemOrgs(orgId: string, orgName: string, orgDid: string, ecosystemId: string, ecosystemRoleId: string): Promise<object> {
    try {
      const data = {
        orgId,
        status: EcosystemOrgStatus.ACTIVE,
        ecosystemId,
        ecosystemRoleId,
        orgName,
        orgDid
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
  async checkInvitationExist(
    email: string,
    ecosystemId: string
  ): Promise<boolean> {
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
    isUserExist: boolean
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new EcosystemInviteTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Invitation`;

    emailData.emailHtml = await urlEmailTemplate.sendInviteEmailTemplate(email, ecosystemName, isUserExist);

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

  /**
   * 
   * @param RequestSchemaEndorsement 
   * @returns 
   */
  async requestSchemaEndorsement(requestSchemaPayload: RequestSchemaEndorsement, orgId: number, ecosystemId: string): Promise<object> {
    try {
      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const [schemaRequestExist, ecosystemMemberDetails, platformConfig, ecosystemLeadAgentDetails, getEcosystemOrgDetailsByOrgId] = await Promise.all([
        this.ecosystemRepository.findRecordsByNameAndVersion(requestSchemaPayload?.name, requestSchemaPayload?.version),
        this.ecosystemRepository.getAgentDetails(orgId),
        this.ecosystemRepository.getPlatformConfigDetails(),
        this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId)),
        this.ecosystemRepository.getEcosystemOrgDetailsbyId(String(orgId), ecosystemId)
      ]);

      if (0 !== schemaRequestExist.length) {
        throw new ConflictException(ResponseMessages.ecosystem.error.schemaAlreadyExist);
      }

      if (!ecosystemMemberDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.notFound);
      }

      if (!platformConfig) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.platformConfigNotFound);
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

      const url = await this.getAgentUrl(ecosystemMemberDetails.orgAgentTypeId, ecosystemMemberDetails.agentEndPoint, endorsementTransactionType.SCHEMA, ecosystemMemberDetails.tenantId);

      const attributeArray = requestSchemaPayload.attributes.map(item => item.attributeName);

      const schemaTransactionPayload = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        endorse: requestSchemaPayload.endorse,
        attributes: attributeArray,
        version: String(requestSchemaPayload.version),
        name: requestSchemaPayload.name,
        issuerId: ecosystemMemberDetails.orgDid
      };

      const schemaTransactionRequest: SchemaMessage = await this._requestSchemaEndorsement(schemaTransactionPayload, url, platformConfig?.sgApiKey);

      const schemaTransactionResponse = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        authorDid: ecosystemMemberDetails.orgDid,
        requestPayload: schemaTransactionRequest.message.schemaState.schemaRequest,
        status: endorsementTransactionStatus.REQUESTED,
        ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id
      };

      if ('failed' === schemaTransactionRequest.message.schemaState.state) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.requestSchemaTransaction);
      }

      return this.ecosystemRepository.storeTransactionRequest(schemaTransactionResponse, requestSchemaPayload, endorsementTransactionType.SCHEMA);
    } catch (error) {
      this.logger.error(`In request schema endorsement : ${JSON.stringify(error)}`);
      throw new RpcException(error.response || error);
    }
  }

  async requestCredDeffEndorsement(requestCredDefPayload: RequestCredDeffEndorsement, orgId: number, ecosystemId: string): Promise<object> {
    try {

      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const [credDefRequestExist, ecosystemMemberDetails, platformConfig, ecosystemLeadAgentDetails, getEcosystemOrgDetailsByOrgId] = await Promise.all([
        this.ecosystemRepository.findRecordsByCredDefTag(requestCredDefPayload?.tag),
        this.ecosystemRepository.getAgentDetails(orgId),
        this.ecosystemRepository.getPlatformConfigDetails(),
        this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId)),
        this.ecosystemRepository.getEcosystemOrgDetailsbyId(String(orgId), ecosystemId)
      ]);

      if (0 !== credDefRequestExist.length) {
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

      const url = await this.getAgentUrl(ecosystemMemberDetails.orgAgentTypeId, ecosystemMemberDetails.agentEndPoint, endorsementTransactionType.CREDENTIAL_DEFINITION, ecosystemMemberDetails.tenantId);

      const credDefTransactionPayload = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        endorse: requestCredDefPayload.endorse,
        tag: requestCredDefPayload.tag,
        schemaId: requestCredDefPayload.schemaId,
        issuerId: ecosystemMemberDetails.orgDid
      };

      const credDefTransactionRequest: CredDefMessage = await this._requestCredDeffEndorsement(credDefTransactionPayload, url, platformConfig?.sgApiKey);

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
        ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id
      };

      return this.ecosystemRepository.storeTransactionRequest(schemaTransactionResponse, requestCredDefPayload, endorsementTransactionType.CREDENTIAL_DEFINITION);
    } catch (error) {
      this.logger.error(`In request cred-def endorsement: ${JSON.stringify(error)}`);
      throw new RpcException(error.response || error);
    }
  }


  async getInvitationsByEcosystemId(
    payload: FetchInvitationsPayload
  ): Promise<object> {
    try {

      const { ecosystemId, pageNumber, pageSize, search } = payload;
      const ecosystemInvitations = await this.ecosystemRepository.getInvitationsByEcosystemId(ecosystemId, pageNumber, pageSize, search);
      return ecosystemInvitations;
    } catch (error) {
      this.logger.error(`In getInvitationsByEcosystemId : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _requestSchemaEndorsement(requestSchemaPayload: object, url: string, apiKey: string): Promise<object> {
    const pattern = { cmd: 'agent-schema-endorsement-request' };
    const payload = { requestSchemaPayload, url, apiKey };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  async _requestCredDeffEndorsement(requestSchemaPayload: object, url: string, apiKey: string): Promise<object> {
    const pattern = { cmd: 'agent-credDef-endorsement-request' };
    const payload = { requestSchemaPayload, url, apiKey };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  async signTransaction(endorsementId: string, ecosystemId: string): Promise<object> {
    try {
      const [endorsementTransactionPayload, ecosystemLeadDetails, platformConfig] = await Promise.all([
        this.ecosystemRepository.getEndorsementTransactionById(endorsementId, endorsementTransactionStatus.REQUESTED),
        this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId),
        this.ecosystemRepository.getPlatformConfigDetails()
      ]);

      if (!endorsementTransactionPayload) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidTransaction);
      }

      if (!ecosystemLeadDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      if (!platformConfig) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.platformConfigNotFound);
      }

      const ecosystemLeadAgentDetails = await this.ecosystemRepository.getAgentDetails(Number(ecosystemLeadDetails.orgId));

      if (!ecosystemLeadAgentDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      const url = await this.getAgentUrl(ecosystemLeadAgentDetails?.orgAgentTypeId, ecosystemLeadAgentDetails.agentEndPoint, endorsementTransactionType.SIGN, ecosystemLeadAgentDetails?.tenantId);

      const jsonString = endorsementTransactionPayload.requestPayload.toString();
      const payload = {
        transaction: jsonString,
        endorserDid: endorsementTransactionPayload.endorserDid
      };

      const schemaTransactionRequest: SignedTransactionMessage = await this._signTransaction(payload, url, platformConfig.sgApiKey);

      if (!schemaTransactionRequest) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.signRequestError);
      }

      const autoEndorsement = `${CommonConstants.ECOSYSTEM_AUTO_ENDOSEMENT}`;
      const ecosystemConfigDetails = await this.ecosystemRepository.getEcosystemConfigDetails(autoEndorsement);

      if (!ecosystemConfigDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.ecosystemConfigNotFound);
      }

      const updateSignedTransaction = await this.ecosystemRepository.updateTransactionDetails(endorsementId, schemaTransactionRequest.message.signedTransaction);

      if (!updateSignedTransaction) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.updateTransactionError);
      }

      if (updateSignedTransaction && 'true' === ecosystemConfigDetails.value) {

        const submitTxn = await this.submitTransaction(endorsementId, ecosystemId, ecosystemLeadAgentDetails.agentEndPoint);
        if (!submitTxn) {
          await this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.REQUESTED);
          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
        }
        return submitTxn;
      }

      return updateSignedTransaction;
    } catch (error) {
      this.logger.error(`In sign transaction: ${JSON.stringify(error)}`);
      throw new RpcException(error.response || error);
    }
  }

  /**
    * 
    * @returns Ecosystem members list
    */
  async getEcoystemMembers(
    payload: EcosystemMembersPayload
  ): Promise<object> {
    try {
      const { ecosystemId, pageNumber, pageSize, search } = payload;
      return await this.ecosystemRepository.findEcosystemMembers(ecosystemId, pageNumber, pageSize, search);
    } catch (error) {
      this.logger.error(`In getEcosystemMembers: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async deleteEcosystemInvitations(invitationId: string): Promise<object> {
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
  async _signTransaction(signEndorsementPayload: object, url: string, apiKey: string): Promise<object> {
    const pattern = { cmd: 'agent-sign-transaction' };
    const payload = { signEndorsementPayload, url, apiKey };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  // eslint-disable-next-line camelcase
  async getEcosystemMemberDetails(endorsementTransactionPayload): Promise<org_agents> {
    const orgId = Number(endorsementTransactionPayload.ecosystemOrgs.orgId);
    return this.ecosystemRepository.getAgentDetails(orgId);
  }

  // eslint-disable-next-line camelcase
  async getEcosystemLeadAgentDetails(ecosystemId): Promise<org_agents> {
    const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);
    return this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId));
  }

  // eslint-disable-next-line camelcase
  async getPlatformConfig(): Promise<platform_config> {
    return this.ecosystemRepository.getPlatformConfigDetails();
  }

  async submitTransactionPayload(endorsementTransactionPayload, ecosystemMemberDetails, ecosystemLeadAgentDetails): Promise<submitTransactionPayload> {
    const parsedRequestPayload = JSON.parse(endorsementTransactionPayload.responsePayload);
    const jsonString = endorsementTransactionPayload.responsePayload.toString();
    const payload: submitTransactionPayload = {
      endorsedTransaction: jsonString,
      endorserDid: ecosystemLeadAgentDetails.orgDid
    };

    if (endorsementTransactionPayload.type === endorsementTransactionType.SCHEMA) {
      payload.schema = {
        attributes: parsedRequestPayload.operation.data.attr_names,
        version: parsedRequestPayload.operation.data.version,
        name: parsedRequestPayload.operation.data.name,
        issuerId: ecosystemMemberDetails.orgDid
      };
    } else if (endorsementTransactionPayload.type === endorsementTransactionType.CREDENTIAL_DEFINITION) {

      payload.credentialDefinition = {
        tag: parsedRequestPayload.operation.tag,
        issuerId: ecosystemMemberDetails.orgDid,
        schemaId: endorsementTransactionPayload.requestBody.credentialDefinition['schemaId'],
        type: endorsementTransactionPayload.requestBody.credentialDefinition['type'],
        value: endorsementTransactionPayload.requestBody.credentialDefinition['value']
      };
    }

    return payload;
  }

  async handleSchemaSubmission(endorsementTransactionPayload, ecosystemMemberDetails, submitTransactionRequest): Promise<schema> {
    const regex = /[^:]+$/;
    const match = ecosystemMemberDetails.orgDid.match(regex);
    let extractedDidValue;

    if (match) {
      // eslint-disable-next-line prefer-destructuring
      extractedDidValue = match[0];

    }
    const saveSchemaPayload: SaveSchema = {
      name: endorsementTransactionPayload.requestBody['name'],
      version: endorsementTransactionPayload.requestBody['version'],
      attributes: JSON.stringify(endorsementTransactionPayload.requestBody['attributes']),
      schemaLedgerId: submitTransactionRequest['message'].schemaId,
      issuerId: ecosystemMemberDetails.orgDid,
      createdBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      lastChangedBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      publisherDid: extractedDidValue,
      orgId: endorsementTransactionPayload.ecosystemOrgs.orgId,
      ledgerId: ecosystemMemberDetails.ledgerId
    };
    const saveSchemaDetails = await this.ecosystemRepository.saveSchema(saveSchemaPayload);
    if (!saveSchemaDetails) {
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.saveSchema);
    }
    return saveSchemaDetails;
  }

  // eslint-disable-next-line camelcase
  async handleCredDefSubmission(endorsementTransactionPayload, ecosystemMemberDetails, submitTransactionRequest): Promise<credential_definition> {
    const schemaDetails = await this.ecosystemRepository.getSchemaDetailsById(endorsementTransactionPayload.requestBody['schemaId']);

    if (!schemaDetails) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.schemaNotFound);
    }

    const saveCredentialDefinition: saveCredDef = {
      schemaLedgerId: endorsementTransactionPayload.requestBody['schemaId'],
      tag: endorsementTransactionPayload.requestBody['tag'],
      credentialDefinitionId: submitTransactionRequest['message'].credentialDefinitionId,
      revocable: false,
      createdBy: endorsementTransactionPayload.ecosystemOrgs.orgId,
      orgId: ecosystemMemberDetails.orgId,
      schemaId: schemaDetails.id
    };

    const saveCredDefDetails = await this.ecosystemRepository.saveCredDef(saveCredentialDefinition);
    if (!saveCredDefDetails) {
      throw new InternalServerErrorException(ResponseMessages.ecosystem.error.saveCredDef);
    }
    return saveCredDefDetails;
  }

  async updateTransactionStatus(endorsementId): Promise<object> {
    return this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.SUBMITED);
  }

  async submitTransaction(endorsementId, ecosystemId, ecosystemLeadAgentEndPoint?): Promise<object> {
    try {
      const endorsementTransactionPayload = await this.ecosystemRepository.getEndorsementTransactionById(endorsementId, endorsementTransactionStatus.SIGNED);
      if (!endorsementTransactionPayload) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidTransaction);
      }

      if ('submitted' === endorsementTransactionPayload.status) {
        throw new ConflictException(ResponseMessages.ecosystem.error.transactionSubmitted);
      }

      const ecosystemMemberDetails = await this.getEcosystemMemberDetails(endorsementTransactionPayload);
      const ecosystemLeadAgentDetails = await this.getEcosystemLeadAgentDetails(ecosystemId);
      const platformConfig = await this.getPlatformConfig();

      const agentEndPoint = ecosystemLeadAgentEndPoint ? ecosystemLeadAgentEndPoint : ecosystemMemberDetails.agentEndPoint;
      const url = await this.getAgentUrl(ecosystemMemberDetails?.orgAgentTypeId, agentEndPoint, endorsementTransactionType.SUBMIT, ecosystemMemberDetails?.tenantId);
      const payload = await this.submitTransactionPayload(endorsementTransactionPayload, ecosystemMemberDetails, ecosystemLeadAgentDetails);

      const submitTransactionRequest = await this._submitTransaction(payload, url, platformConfig.sgApiKey);

      if ('failed' === submitTransactionRequest['message'].state) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
      }

      await this.updateTransactionStatus(endorsementId);

      if (endorsementTransactionPayload.type === endorsementTransactionType.SCHEMA) {

        const updateSchemaId = await this._updateResourceId(endorsementId, endorsementTransactionType.SCHEMA, submitTransactionRequest);
        
        if (!updateSchemaId) {

          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.updateSchemaId);
        }
        return this.handleSchemaSubmission(endorsementTransactionPayload, ecosystemMemberDetails, submitTransactionRequest);
      } else if (endorsementTransactionPayload.type === endorsementTransactionType.CREDENTIAL_DEFINITION) {

        if ('undefined' === submitTransactionRequest['message'].credentialDefinitionId.split(':')[3]) {

          const autoEndorsement = `${CommonConstants.ECOSYSTEM_AUTO_ENDOSEMENT}`;
          const ecosystemConfigDetails = await this.ecosystemRepository.getEcosystemConfigDetails(autoEndorsement);

          if ('true' === ecosystemConfigDetails.value) {

            await this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.REQUESTED);
          } else {

            await this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.SIGNED);
          }

          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
        }
        const updateCredDefId = await this._updateResourceId(endorsementId, endorsementTransactionType.CREDENTIAL_DEFINITION, submitTransactionRequest);

        if (!updateCredDefId) {

          throw new InternalServerErrorException(ResponseMessages.ecosystem.error.updateCredDefId);
        }
        return this.handleCredDefSubmission(endorsementTransactionPayload, ecosystemMemberDetails, submitTransactionRequest);
      }
    } catch (error) {
      this.logger.error(`In submit transaction: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  /**
     * Description: Store shortening URL 
     * @param signEndorsementPayload 
     * @param url 
     * @returns sign message
     */
  async _submitTransaction(submitEndorsementPayload: object, url: string, apiKey: string): Promise<object> {
    const pattern = { cmd: 'agent-submit-transaction' };
    const payload = { submitEndorsementPayload, url, apiKey };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.ecosystemServiceProxy.send<any>(pattern, payload).toPromise();
      return { message };
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  async _updateResourceId(endorsementId: string, transactionType: endorsementTransactionType, transactionDetails: object): Promise<object> {
    try {
      // eslint-disable-next-line prefer-destructuring
      const message = transactionDetails['message'];
      if (!message) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidMessage);
      }

      const resourceId = message[transactionType === endorsementTransactionType.SCHEMA ? 'schemaId' : 'credentialDefinitionId'];

      if (!resourceId) {
        throw new Error(`${ResponseMessages.ecosystem.error.invalidTransactionMessage} Missing "${transactionType === endorsementTransactionType.SCHEMA ? 'schemaId' : 'credentialDefinitionId'}" property.`);
      }

      return await this.ecosystemRepository.updateResourse(endorsementId, resourceId);
    } catch (error) {
      this.logger.error(`Error updating resource ID: ${JSON.stringify(error)}`);
    }
  }


  async getAgentUrl(
    orgAgentTypeId: number,
    agentEndPoint: string,
    type: string,
    tenantId?: string
  ): Promise<string> {
    try {
      let url;

      if (orgAgentTypeId === OrgAgentType.DEDICATED) {
        if (type === endorsementTransactionType.SCHEMA) {
          url = `${agentEndPoint}${CommonConstants.URL_SCHM_CREATE_SCHEMA}`;
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

  async fetchEcosystemOrg(
    payload: { ecosystemId: string, orgId: string }
  ): Promise<object> {

    const isEcosystemEnabled = await this.checkEcosystemEnableFlag();

    if (!isEcosystemEnabled) {
      throw new ForbiddenException(ResponseMessages.ecosystem.error.ecosystemNotEnabled);
    }

    return this.ecosystemRepository.fetchEcosystemOrg(
      payload
    );
  }

  /**
   * 
   * @returns Returns ecosystem flag from settings
   */
  async checkEcosystemEnableFlag(
  ): Promise<boolean> {
    const ecosystemDetails = await this.prisma.ecosystem_config.findFirst(
      {
        where: {
          key: 'enableEcosystem'
        }
      }
    );

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


  async getAllEcosystemSchemas(ecosystemSchemas: GetAllSchemaList): Promise<object> {
    try {

      const response = await this.ecosystemRepository.getAllEcosystemSchemasDetails(ecosystemSchemas);
      this.logger.error(`In error getAllEcosystemSchemas1: ${JSON.stringify(response)}`);
      const schemasDetails = response?.schemasResult.map(schemaAttributeItem => {
        const attributes = JSON.parse(schemaAttributeItem.attributes);
        return { ...schemaAttributeItem, attributes };
      });
      
      const schemasResponse = {
        totalItems: response.schemasCount,
        hasNextPage: ecosystemSchemas.pageSize * ecosystemSchemas.pageNumber < response.schemasCount,
        hasPreviousPage: 1 < ecosystemSchemas.pageNumber,
        nextPage: ecosystemSchemas.pageNumber + 1,
        previousPage: ecosystemSchemas.pageNumber - 1,
        lastPage: Math.ceil(response.schemasCount / ecosystemSchemas.pageSize),
        data: schemasDetails
      };
      this.logger.error(`In error getAllEcosystemSchemas1: ${JSON.stringify(response)}`);
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

      return await this.ecosystemRepository.updateEndorsementRequestStatus(ecosystemId, endorsementId);
    } catch (error) {
      this.logger.error(`error in decline endorsement request: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

}
