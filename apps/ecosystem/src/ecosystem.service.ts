// eslint-disable-next-line camelcase
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EcosystemRepository } from './ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class EcosystemService {
  constructor(
    @Inject('NATS_CLIENT') private readonly ecosystemServiceProxy: ClientProxy,
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger

  ) { }

  /**
   *
   * @param createEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem(createEcosystemDto): Promise<object> {
    const createEcosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto);
    if (!createEcosystem) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
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
  async getAllEcosystem(): Promise<object> {
    const getAllEcosystemDetails = await this.ecosystemRepository.getAllEcosystemDetails();
    if (!getAllEcosystemDetails) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
    }
    return getAllEcosystemDetails;
  }

  /**
   * 
   * @param bulkInvitationDto 
   * @param userId 
   * @returns 
   */
  async createInvitation(bulkInvitationDto: BulkSendInvitationDto, userId: string): Promise<string> {
    const { invitations, ecosystemId } = bulkInvitationDto;

    try {
      const ecosystemDetails = await this.ecosystemRepository.getEcosystemDetails(ecosystemId);

      for (const invitation of invitations) {
        const { email } = invitation;

        const isInvitationExist = await this.checkInvitationExist(email, ecosystemId);

        if (!isInvitationExist) {
          await this.ecosystemRepository.createSendInvitation(email, ecosystemId, userId);

          try {
            await this.sendInviteEmailTemplate(email, ecosystemDetails.name);
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
      this.logger.error(`acceptRejectInvitations: ${error}`);
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

      if (0 < invitations.length) {
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
    ecosystemName: string
  ): Promise<boolean> {
    const platformConfigData = await this.prisma.platform_config.findMany();

    const urlEmailTemplate = new EcosystemInviteTemplate();
    const emailData = new EmailDto();
    emailData.emailFrom = platformConfigData[0].emailFrom;
    emailData.emailTo = email;
    emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Invitation`;

    emailData.emailHtml = await urlEmailTemplate.sendInviteEmailTemplate(email, ecosystemName);

    //Email is sent to user for the verification through emailData
    const isEmailSent = await sendEmail(emailData);

    return isEmailSent;
  }

  /**
   * 
   * @param RequestSchemaEndorsement 
   * @returns 
   */
  async requestSchemaEndorsement(requestSchemaPayload: RequestSchemaEndorsement, orgId: number, ecosystemId:string): Promise<object> {
    try {
     
      const ecosystemMemberDetails = await this.ecosystemRepository.getAgentDetails(orgId);
      if (!ecosystemMemberDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.notFound);
      }

      // eslint-disable-next-line camelcase
      const platformConfig: platform_config = await this.ecosystemRepository.getPlatformConfigDetails();

      const url = await this.getAgentUrl(ecosystemMemberDetails?.orgAgentTypeId, ecosystemMemberDetails.agentEndPoint, endorsementTransactionType.SCHEMA, ecosystemMemberDetails?.tenantId);

      const attributeArray = requestSchemaPayload.attributes.map(item => item.attributeName);

      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const ecosystemLeadAgentDetails = await this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId));

      if (!ecosystemLeadAgentDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      const getEcosystemOrgDetailsByOrgId = await this.ecosystemRepository.getEcosystemOrgDetailsbyId(String(orgId));

      const schemaTransactionPayload: SchemaTransactionPayload = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        endorse: requestSchemaPayload.endorse,
        attributes: attributeArray,
        version: String(requestSchemaPayload.version),
        name: requestSchemaPayload.name,
        issuerId: ecosystemMemberDetails.orgDid
      };

      const schemaTransactionRequest: SchemaMessage = await this._requestSchemaEndorsement(schemaTransactionPayload, url, platformConfig?.sgApiKey);
      const schemaTransactionResponse: SchemaTransactionResponse = {
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

      throw new RpcException(error.response ? error.response : error);
    }
  }

  async requestCredDeffEndorsement(requestCredDefPayload: RequestCredDeffEndorsement, orgId: number, ecosystemId:string): Promise<object> {
    try {
      const ecosystemMemberDetails = await this.ecosystemRepository.getAgentDetails(orgId);
      if (!ecosystemMemberDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.notFound);
      }

      // eslint-disable-next-line camelcase
      const platformConfig: platform_config = await this.ecosystemRepository.getPlatformConfigDetails();

      const url = await this.getAgentUrl(ecosystemMemberDetails?.orgAgentTypeId, ecosystemMemberDetails.agentEndPoint, endorsementTransactionType.CREDENTIAL_DEFINITION, ecosystemMemberDetails?.tenantId);

      // const attributeArray = requestSchemaPayload.attributes.map(item => item.attributeName);

      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      const ecosystemLeadAgentDetails = await this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId));

      if (!ecosystemLeadAgentDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }

      const getEcosystemOrgDetailsByOrgId = await this.ecosystemRepository.getEcosystemOrgDetailsbyId(String(orgId));

      const credDefTransactionPayload: CredDefTransactionPayload = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        endorse: requestCredDefPayload.endorse,
        tag: requestCredDefPayload.tag,
        schemaId: requestCredDefPayload.schemaId,
        issuerId: ecosystemMemberDetails.orgDid
      };
      // Need to add logic and type for credential-definition
      const credDefTransactionRequest:CredDefMessage = await this._requestCredDeffEndorsement(credDefTransactionPayload, url, platformConfig?.sgApiKey);
      const schemaTransactionResponse = {
        endorserDid: ecosystemLeadAgentDetails.orgDid,
        authorDid: ecosystemMemberDetails.orgDid,
        requestPayload: credDefTransactionRequest.message.credentialDefinitionState.credentialDefinitionRequest,
        status: endorsementTransactionStatus.REQUESTED,
        ecosystemOrgId: getEcosystemOrgDetailsByOrgId.id
      };

      if ('failed' === credDefTransactionRequest.message.credentialDefinitionState.state) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.requestCredDefTransaction);
      }

      return this.ecosystemRepository.storeTransactionRequest(schemaTransactionResponse, requestCredDefPayload, endorsementTransactionType.CREDENTIAL_DEFINITION);
    } catch (error) {
      this.logger.error(`In request cred-def endorsement : ${JSON.stringify(error)}`);

      throw new RpcException(error.response ? error.response : error);
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

  async signTransaction(endorsementId: string, ecosystemId:string): Promise<object> {
    try {
      const endorsementTransactionPayload = await this.ecosystemRepository.getEndorsementTransactionById(endorsementId, endorsementTransactionStatus.REQUESTED);
      if (!endorsementTransactionPayload) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidTransaction);
      }

      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);

      if (!getEcosystemLeadDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }
      // eslint-disable-next-line camelcase
      const platformConfig: platform_config = await this.ecosystemRepository.getPlatformConfigDetails();

      const ecosystemLeadAgentDetails = await this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId));
      const url = await this.getAgentUrl(ecosystemLeadAgentDetails?.orgAgentTypeId, ecosystemLeadAgentDetails.agentEndPoint, endorsementTransactionType.SIGN, ecosystemLeadAgentDetails?.tenantId);

      if (!ecosystemLeadAgentDetails) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.leadNotFound);
      }
      const jsonString = endorsementTransactionPayload.requestPayload.toString();
      const payload = {
        transaction: jsonString,
        endorserDid: endorsementTransactionPayload.endorserDid
      };

      const schemaTransactionRequest: SignedTransactionMessage = await this._signTransaction(payload, url, platformConfig.sgApiKey);
      return this.ecosystemRepository.updateTransactionDetails(endorsementId, schemaTransactionRequest.message.signedTransaction);

    } catch (error) {
      this.logger.error(`In sign transaction : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
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
        const { ecosystemId, pageNumber, pageSize, search} = payload;
          return await this.ecosystemRepository.findEcosystemMembers(ecosystemId, pageNumber, pageSize, search);
      } catch (error) {
        this.logger.error(`In getEcosystemMembers: ${JSON.stringify(error)}`);
        throw new RpcException(error.response ? error.response : error);
      }
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

  async submitTransaction(endorsementId: string, ecosystemId:string): Promise<object> {
    try {
      const endorsementTransactionPayload: EndorsementTransactionPayload = await this.ecosystemRepository.getEndorsementTransactionById(endorsementId, endorsementTransactionStatus.SIGNED);
      if (!endorsementTransactionPayload) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.invalidTransaction);
      }
      const ecosystemMemberDetails = await this.ecosystemRepository.getAgentDetails(Number(endorsementTransactionPayload.ecosystemOrgs.orgId));

      const getEcosystemLeadDetails = await this.ecosystemRepository.getEcosystemLeadDetails(ecosystemId);
      // eslint-disable-next-line camelcase
      const platformConfig: platform_config = await this.ecosystemRepository.getPlatformConfigDetails();

      const ecosystemLeadAgentDetails = await this.ecosystemRepository.getAgentDetails(Number(getEcosystemLeadDetails.orgId));

      const url = await this.getAgentUrl(ecosystemMemberDetails?.orgAgentTypeId, ecosystemMemberDetails.agentEndPoint, endorsementTransactionType.SUBMIT, ecosystemMemberDetails?.tenantId);

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
          schemaId: parsedRequestPayload.operation.schemaId
        };
      }
      // Need to add valid schema Id
      const submitTransactionRequest = await this._submitTransaction(payload, url, platformConfig.sgApiKey);
      // need to implement the type and state
      if (!submitTransactionRequest) {
        throw new InternalServerErrorException(ResponseMessages.ecosystem.error.sumbitTransaction);
      }
      return this.ecosystemRepository.updateTransactionStatus(endorsementId, endorsementTransactionStatus.SUBMITED);

    } catch (error) {
      this.logger.error(`In sumit transaction : ${JSON.stringify(error)}`);
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
    const platformConfigData = await this.prisma.ecosystem_config.findMany();
    return platformConfigData[0].enableEcosystem;
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

      const ecosystemOrgData =  await this.ecosystemRepository.fetchEcosystemOrg(queryEcoOrgs);

      if (ecosystemOrgData['ecosystemRole']['name'] !== EcosystemRoles.ECOSYSTEM_LEAD) {
        query.ecosystemOrgs['orgId'] = orgId;
      }
      
      if (type) {
        query['type'] = type;
      }

      return await this.ecosystemRepository.getEndorsementsWithPagination(query, pageNumber, pageSize);
    } catch (error) {
      this.logger.error(`In error getEndorsementTransactions: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }


   /**
   * 
   * @param ecosystemId 
   * @param endorsementId 
   * @param orgId 
   * @returns EndorsementTransactionRequest Status message
   */

   async declineEndorsementRequestByLead(ecosystemId:string, endorsementId:string, orgId:string): Promise<object> {
    try {

      return await this.ecosystemRepository.updateEndorsementRequestStatus(ecosystemId, orgId, endorsementId);
      } catch (error) {
      this.logger.error(`error in decline endorsement request: ${error}`);
      throw new InternalServerErrorException(error);
    }
  }

}
