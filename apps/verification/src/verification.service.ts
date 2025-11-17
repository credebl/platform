/* eslint-disable camelcase */
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs/operators';
import { IGetAllProofPresentations, IProofRequestSearchCriteria, IGetProofPresentationById, IProofPresentation, IProofRequestPayload, IRequestProof, ISendProofRequestPayload, IVerifyPresentation, IVerifiedProofData, IInvitation } from './interfaces/verification.interface';
import { VerificationRepository } from './repositories/verification.repository';
import { ATTRIBUTE_NAME_REGEX, CommonConstants } from '@credebl/common/common.constant';
import { RecordType, agent_invitations, org_agents, organisation, user } from '@prisma/client';
import { AutoAccept, OrgAgentType, VerificationProcessState } from '@credebl/enum/enum';
import { ResponseMessages } from '@credebl/common/response-messages';
import * as QRCode from 'qrcode';
import { OutOfBandVerification } from '../templates/out-of-band-verification.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IProofPresentationDetails, IProofPresentationList, IVerificationRecords } from '@credebl/common/interfaces/verification.interface';
import { ProofRequestType } from 'apps/api-gateway/src/verification/enum/verification.enum';
import { UserActivityService } from '@credebl/user-activity';
import { convertUrlToDeepLinkUrl } from '@credebl/common/common.utils';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { ISchemaDetail } from '@credebl/common/interfaces/schema.interface';

@Injectable()
export class VerificationService {

  private readonly logger = new Logger('VerificationService');

  constructor(
    @Inject('NATS_CLIENT') private readonly verificationServiceProxy: ClientProxy,
    private readonly verificationRepository: VerificationRepository,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly outOfBandVerification: OutOfBandVerification,
    private readonly userActivityService: UserActivityService,
    private readonly emailData: EmailDto,
    @Inject(CACHE_MANAGER) private cacheService: Cache

  ) { }

  /**
   * Get all proof presentations
   * @param user 
   * @param orgId 
   * @returns Get all proof presentation
   */

  async getProofPresentations(
    user: IUserRequest,
    orgId: string,
    proofRequestsSearchCriteria: IProofRequestSearchCriteria
  ): Promise<IProofPresentationList> {
    try {
      const getProofRequestsList = await this.verificationRepository.getAllProofRequests(
        user,
        orgId,
        proofRequestsSearchCriteria
      );
      
      const schemaIds = getProofRequestsList?.proofRequestsList?.map((schema) => schema?.schemaId).filter(Boolean);

      const getSchemaDetails = await this._getSchemaAndOrganizationDetails(schemaIds);
      
      const proofDetails = getProofRequestsList.proofRequestsList.map((proofRequest) => {
        const schemaDetail = getSchemaDetails.find((schema) => schema.schemaLedgerId === proofRequest.schemaId);

        return {
          ...proofRequest,
          schemaName: schemaDetail ? schemaDetail?.name : '',
          issuanceEntity: schemaDetail ? schemaDetail?.['organisation']?.name : ''
        };
      });

      if (0 === getProofRequestsList.proofRequestsCount) {
        throw new NotFoundException(ResponseMessages.verification.error.proofPresentationNotFound);
      }

      const proofPresentationsResponse: {
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number;
        previousPage: number;
        lastPage: number;
        data: {
          createDateTime: Date;
          createdBy: string;
          connectionId: string;
          state: string;
          orgId: string;
          presentationId: string;
          id: string;
        }[];
      } = {
        totalItems: getProofRequestsList.proofRequestsCount,
        hasNextPage:
          proofRequestsSearchCriteria.pageSize * proofRequestsSearchCriteria.pageNumber < getProofRequestsList.proofRequestsCount,
        hasPreviousPage: 1 < proofRequestsSearchCriteria.pageNumber,
        nextPage: Number(proofRequestsSearchCriteria.pageNumber) + 1,
        previousPage: proofRequestsSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(getProofRequestsList.proofRequestsCount / proofRequestsSearchCriteria.pageSize),
        data: proofDetails || getProofRequestsList?.proofRequestsList
      };

      return proofPresentationsResponse;
    } catch (error) {

      this.logger.error(
        `[getProofRequests] [NATS call]- error in fetch proof requests details : ${JSON.stringify(error)}`
      );
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getSchemaAndOrganizationDetails(templateIds: string[]): Promise<ISchemaDetail[]> {
    const pattern = { cmd: 'get-schemas-details' };

    const payload = {
      templateIds
    };
    const schemaAndOrgDetails = await this.verificationServiceProxy
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
    return schemaAndOrgDetails;
  }

  async getVerificationRecords(orgId: string): Promise<number> {
    try {
      return await this.verificationRepository.getVerificationRecordsCount(orgId);
    } catch (error) {

      this.logger.error(
        `[getVerificationRecords ] [NATS call]- error in get verification records count : ${JSON.stringify(error)}`
      );
      throw new RpcException(error.response ? error.response : error);
    }
  }


  /**
   * Consume agent API for get all proof presentations
   * @param payload 
   * @returns Get all proof presentation
   */
  async _getProofPresentations(payload: IGetAllProofPresentations): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-proof-presentations' };
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_getProofPresentations] - error in get proof presentations : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Get proof presentation by proofId
   * @param proofId 
   * @param orgId 
   * @returns Proof presentation details by proofId
   */
  async getProofPresentationById(proofId: string, orgId: string): Promise<string> {
    try {
      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(orgId);

      const verificationMethodLabel = 'get-proof-presentation-by-id';
      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId, '', proofId);
      
      const payload = { orgId, url };

      const getProofPresentationById = await this._getProofPresentationById(payload);
      return getProofPresentationById?.response;
    } catch (error) {
      this.logger.error(`[getProofPresentationById] - error in get proof presentation by proofId : ${JSON.stringify(error)}`);
      const errorStack = error?.response?.error?.reason;

      if (errorStack) {
        throw new RpcException({
          message: ResponseMessages.verification.error.proofNotFound,
          statusCode: error?.response?.status,
          error: errorStack
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  /**
   * Consume agent API for get proof presentation by id
   * @param payload 
   * @returns Get proof presentation details
   */
  async _getProofPresentationById(payload: IGetProofPresentationById): Promise<{
    response: string;
  }> {
    try {

      const pattern = {
        cmd: 'agent-get-proof-presentation-by-id'
      };

      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_getProofPresentationById] - error in get proof presentation by id : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Send proof request
   * @param orgId 
   * @returns Requested proof presentation details
   */
  async sendProofRequest(requestProof: ISendProofRequestPayload): Promise<string> {
    try {
      const comment = requestProof.comment ? requestProof.comment : '';

      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(requestProof.orgId);

      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      const verificationMethodLabel = 'request-proof';
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);
      
      const payload: IProofRequestPayload = {
        orgId: requestProof.orgId,
        url,
        proofRequestPayload: {}
      };

      const proofRequestPayload = {
        comment,
        connectionId: requestProof.connectionId,
        autoAcceptProof: requestProof.autoAcceptProof ? requestProof.autoAcceptProof : AutoAccept.Never,
        goalCode: requestProof.goalCode || undefined,
        parentThreadId: requestProof.parentThreadId || undefined,
        willConfirm: requestProof.willConfirm || undefined
      };

      if (requestProof.type === ProofRequestType.INDY) {
        const { requestedAttributes, requestedPredicates } = await this._proofRequestPayload(requestProof as IRequestProof);
        payload.proofRequestPayload = {
          protocolVersion: requestProof.protocolVersion ? requestProof.protocolVersion : 'v1',
          proofFormats: {
            indy: {
              name: 'Proof Request',
              version: '1.0',
              requested_attributes: requestedAttributes,
              requested_predicates: requestedPredicates
            }
          },
          ...proofRequestPayload
        };

      } else if (requestProof.type === ProofRequestType.PRESENTATIONEXCHANGE) {
        payload.proofRequestPayload = {
          protocolVersion: requestProof.protocolVersion ? requestProof.protocolVersion : 'v2',
          proofFormats: {
            presentationExchange: {
              presentationDefinition: requestProof.presentationDefinition
            }
        },
        ...proofRequestPayload
      };
    }
      const getProofPresentationById = await this._sendProofRequest(payload);
      return getProofPresentationById?.response;
    } catch (error) {
      this.logger.error(`[verifyPresentation] - error in verify presentation : ${JSON.stringify(error)}`);
      this.verificationErrorHandling(error);

    }
  }

  /**
   * Consume agent API for request proof presentation
   * @param orgId 
   * @returns Get requested proof presentation details
   */
  async _sendProofRequest(payload: IProofRequestPayload): Promise<{
    response: string;
  }> {
    try {

      const pattern = {
        cmd: 'agent-send-proof-request'
      };

      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_sendProofRequest] - error in verify presentation : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Verify proof presentation
   * @param proofId 
   * @param orgId 
   * @returns Verified proof presentation details
   */
  async verifyPresentation(proofId: string, orgId: string): Promise<string> {
    try {
      const getAgentData = await this.verificationRepository.getAgentEndPoint(orgId);
      const orgAgentTypeData = await this.verificationRepository.getOrgAgentType(getAgentData?.orgAgentTypeId);
      
      const verificationMethod = 'accept-presentation';
      
      const url = await this.getAgentUrl(verificationMethod, orgAgentTypeData, getAgentData?.agentEndPoint, getAgentData?.tenantId, '', proofId);
      
      const payload = { orgId, url };
      const getProofPresentationById = await this._verifyPresentation(payload);
      return getProofPresentationById?.response;
    } catch (error) {
      this.logger.error(`[getProofPresentationById] - error in get proof presentation by proofId : ${JSON.stringify(error)}`);
      const errorStack = error?.response?.error?.reason;

      if (errorStack) {
        throw new RpcException({
          message: ResponseMessages.verification.error.proofNotFound,
          statusCode: error?.response?.status,
          error: errorStack
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  /**
   * Consume agent API for verify proof presentation
   * @param payload 
   * @returns Get verified proof presentation details
   */
  async _verifyPresentation(payload: IVerifyPresentation): Promise<{
    response: string;
  }> {
    try {

      const pattern = {
        cmd: 'agent-verify-presentation'
      };

      return await this.natsCall(pattern, payload);

    } catch (error) {
      this.logger.error(`[_verifyPresentation] - error in verify presentation : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async webhookProofPresentation(proofPresentationPayload: IProofPresentation): Promise<org_agents> {
    try {
      const proofPresentation = await this.verificationRepository.storeProofPresentation(proofPresentationPayload);
      return proofPresentation;

    } catch (error) {
      this.logger.error(`[webhookProofPresentation] - error in webhook proof presentation : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  /**
 * Request out-of-band proof presentation
 * @param outOfBandRequestProof 
 * @returns Get requested proof presentation details
 */
  async sendOutOfBandPresentationRequest(outOfBandRequestProof: ISendProofRequestPayload, user: IUserRequest): Promise<boolean | object> {
    try {

      // const { requestedAttributes, requestedPredicates } = await this._proofRequestPayload(outOfBandRequestProof);
     
      const [getAgentDetails, getOrganization] = await Promise.all([
        this.verificationRepository.getAgentEndPoint(user.orgId),
        this.verificationRepository.getOrganization(user.orgId)
      ]);

      const label = getOrganization?.name;

      if (getOrganization?.logoUrl) {
        outOfBandRequestProof['imageUrl'] = getOrganization?.logoUrl;
      }
      
      outOfBandRequestProof['label'] = label;

      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      const verificationMethodLabel = 'create-request-out-of-band';
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);
      

      // Destructuring 'outOfBandRequestProof' to remove emailId, as it is not used while agent operation
      const { isShortenUrl, emailId, type, reuseConnection, ...updateOutOfBandRequestProof } = outOfBandRequestProof;
      let invitationDid: string | undefined;
      if (true === reuseConnection) {
        const invitation: agent_invitations = await this.verificationRepository.getInvitationDidByOrgId(user.orgId);
        invitationDid = invitation?.invitationDid ?? undefined;
      }
      outOfBandRequestProof.autoAcceptProof = outOfBandRequestProof.autoAcceptProof || AutoAccept.Always;


      let payload: IProofRequestPayload;

      if (ProofRequestType.INDY === type) {
        updateOutOfBandRequestProof.protocolVersion = updateOutOfBandRequestProof.protocolVersion || 'v1';
        updateOutOfBandRequestProof.invitationDid = invitationDid || undefined;
        updateOutOfBandRequestProof.imageUrl = getOrganization?.logoUrl || undefined;
        payload   = {
        orgId: user.orgId,
        url,
        proofRequestPayload: updateOutOfBandRequestProof
      };
      }
      
      if (ProofRequestType.PRESENTATIONEXCHANGE === type) {

         payload = {
          orgId: user.orgId,
          url,
          proofRequestPayload: {
            goalCode: outOfBandRequestProof.goalCode,
            parentThreadId: outOfBandRequestProof.parentThreadId,
            protocolVersion:outOfBandRequestProof.protocolVersion || 'v2',
            comment:outOfBandRequestProof.comment,
            label,
            imageUrl: outOfBandRequestProof?.imageUrl,
            proofFormats: {
              presentationExchange: {
                presentationDefinition: {
                  id: outOfBandRequestProof.presentationDefinition.id,
                  name: outOfBandRequestProof.presentationDefinition.name,
                  purpose: outOfBandRequestProof.presentationDefinition.purpose,
                  input_descriptors: [...outOfBandRequestProof.presentationDefinition.input_descriptors]
                }
              }
            },
            autoAcceptProof:outOfBandRequestProof.autoAcceptProof,
            invitationDid:invitationDid || undefined
          }
        };  
      }

      if (emailId) {
        const emailResponse = await this.sendEmailInBatches(payload, emailId, getAgentDetails, getOrganization);
        return emailResponse;
      } else {
        const presentationProof: IInvitation = await this.generateOOBProofReq(payload);
        const proofRequestInvitationUrl: string = presentationProof.invitationUrl;
        if (isShortenUrl) {
          const shortenedUrl: string = await this.storeVerificationObjectAndReturnUrl(proofRequestInvitationUrl, false);
          this.logger.log('shortenedUrl', shortenedUrl);
          if (shortenedUrl) {
            presentationProof.invitationUrl = shortenedUrl;
            presentationProof.deepLinkURL = convertUrlToDeepLinkUrl(shortenedUrl);
          }
        }
        if (!presentationProof) {
          throw new Error(ResponseMessages.verification.error.proofPresentationNotFound);
        }
        return presentationProof;
      }      
    } catch (error) {
      this.logger.error(`[sendOutOfBandPresentationRequest] - error in out of band proof request : ${error.message}`);
      this.verificationErrorHandling(error);
    }
  }

  async storeVerificationObjectAndReturnUrl(storeObj: string, persistent: boolean): Promise<string> {
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'store-object-return-url' };
    const payload = { persistent, storeObj };
    const message = await this.natsCall(pattern, payload);
    return message.response;
  }


  private async generateOOBProofReq(payload: IProofRequestPayload): Promise<object> {
    const getProofPresentation = await this._sendOutOfBandProofRequest(payload);

    if (!getProofPresentation) {
      throw new Error(ResponseMessages.verification.error.proofPresentationNotFound);
    }
    return getProofPresentation.response;
  }


  // Currently batch size is not used, as length of emails sent is restricted to '10'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendEmailInBatches(payload: IProofRequestPayload, emailIds: string[], getAgentDetails: org_agents, organizationDetails: organisation): Promise<any> {
    try {
    const accumulatedErrors = [];
    const accumulatedResponse = [];

        for (const email of emailIds) {
          try {
                const response = await this.sendOutOfBandProofRequest(payload, email, getAgentDetails, organizationDetails);
                accumulatedResponse.push({email, ...response});
                await this.delay(500);
              } catch (error) {
                this.logger.error(`Error sending email to ${email}::::::`, error);
                accumulatedErrors.push(error);
              }
        }

    if (0 < accumulatedErrors.length) {
      this.logger.error(accumulatedErrors);
      throw new Error(ResponseMessages.verification.error.emailSend);
    }

    return accumulatedResponse;

  } catch (error) {
    this.logger.error('[sendEmailInBatches] - error in sending email in batches');
    throw new Error(ResponseMessages.verification.error.batchEmailSend);
  }
  }


  // This function is specifically for OOB verification using email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendOutOfBandProofRequest(payload: IProofRequestPayload, email: string, getAgentDetails: org_agents, organizationDetails: organisation): Promise<any> {
    const getProofPresentation = await this._sendOutOfBandProofRequest(payload);    

    if (!getProofPresentation) {
      throw new Error(ResponseMessages.verification.error.proofPresentationNotFound);
    }

    const invitationUrl = getProofPresentation?.response?.invitationUrl;
    // Currently have shortenedUrl to store only for 30 days
    const persist: boolean = false;
    const shortenedUrl = await this.storeVerificationObjectAndReturnUrl(invitationUrl, persist);
    const deepLinkURL = convertUrlToDeepLinkUrl(shortenedUrl);
    const qrCodeOptions: QRCode.QRCodeToDataURLOptions = { type: 'image/png' };
    const outOfBandVerificationQrCode = await QRCode.toDataURL(shortenedUrl, qrCodeOptions);

    const platformConfigData = await this.verificationRepository.getPlatformConfigDetails();

    if (!platformConfigData) {
      throw new Error(ResponseMessages.verification.error.platformConfigNotFound);
    }

    this.emailData.emailFrom = platformConfigData.emailFrom;
    this.emailData.emailTo = email;
    this.emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Verification of Your Credentials`;
    this.emailData.emailHtml = await this.outOfBandVerification.outOfBandVerification(email, organizationDetails.name, deepLinkURL);
    this.emailData.emailAttachments = [
      {
        filename: 'qrcode.png',
        content: outOfBandVerificationQrCode.split(';base64,')[1],
        contentType: 'image/png',
        disposition: 'attachment'
      }
    ];
    const isEmailSent = await sendEmail(this.emailData);

    if (!isEmailSent) {
      throw new Error(ResponseMessages.verification.error.emailSend);
    }

    return {
              isEmailSent,
              outOfBandRecordId: getProofPresentation?.response?.outOfBandRecord?.id,
              proofRecordThId: getProofPresentation?.response?.proofRecordThId
          };
  }


  /**
   * Consume agent API for request out-of-band proof presentation
   * @param payload 
   * @returns Get requested proof presentation details
   */
  async _sendOutOfBandProofRequest(payload: IProofRequestPayload): Promise<{
    response;
  }> {
    try {

      const pattern = {
        cmd: 'agent-send-out-of-band-proof-request'
      };

      this.logger.log(`_sendOutOfBandProofRequest: nats call payload: ${JSON.stringify(payload)}`);
      return await this.natsCall(pattern, payload);

    } catch (error) {
      this.logger.error(`[_sendOutOfBandProofRequest] - error in Out Of Band Presentation : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _proofRequestPayload(proofRequestpayload: IRequestProof): Promise<{
    requestedAttributes;
    requestedPredicates;
  }> {
    try {
      let requestedAttributes = {}; 
      const requestedPredicates = {};
      const { attributes } = proofRequestpayload;
      if (attributes) {
        requestedAttributes = Object.fromEntries(attributes.map((attribute, index) => {
          const attributeElement = attribute.attributeName || attribute.attributeNames;
          const attributeReferent = `additionalProp${index + 1}`;
          const attributeKey = attribute.attributeName ? 'name' : 'names';
          
          if (!attribute.condition && !attribute.value) {

            return [
              attributeReferent,
              {
                [attributeKey]: attributeElement,
                restrictions: [
                  {
                    cred_def_id: proofRequestpayload.attributes[index].credDefId ? proofRequestpayload.attributes[index].credDefId : undefined,
                    schema_id: proofRequestpayload.attributes[index].schemaId
                  }
                ]
              }
            ];
          } else {
            requestedPredicates[attributeReferent] = {
              p_type: attribute.condition,
              name: attributeElement,
              p_value: parseInt(attribute.value),
              restrictions: [
                {
                  cred_def_id: proofRequestpayload.attributes[index].credDefId ? proofRequestpayload.attributes[index].credDefId : undefined,
                  schema_id: proofRequestpayload.attributes[index].schemaId
                }
              ]
            };
          }

          return [attributeReferent];
          }));

        return {
          requestedAttributes,
          requestedPredicates
        };
      } else {
        throw new BadRequestException(ResponseMessages.verification.error.proofNotSend);
      }
    } catch (error) {
      this.logger.error(`[proofRequestPayload] - error in proof request payload : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);

    }
  }

  /**
  * Description: Fetch agent url 
  * @param referenceId 
  * @returns agent URL
  */
  async getAgentUrl(
    verificationMethodLabel: string,
    orgAgentType: string,
    agentEndPoint: string,
    tenantId: string,
    threadId?: string,
    proofPresentationId?: string
  ): Promise<string> {
    try {
      

      let url;
      switch (verificationMethodLabel) {
        case 'get-proof-presentation': {
          url = orgAgentType === OrgAgentType.DEDICATED && threadId
            ? `${agentEndPoint}${CommonConstants.URL_GET_PROOF_PRESENTATIONS}?threadId=${threadId}`
            : orgAgentType === OrgAgentType.SHARED && threadId
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_PROOFS}?threadId=${threadId}`.replace('#', tenantId)
              : orgAgentType === OrgAgentType.DEDICATED
                ? `${agentEndPoint}${CommonConstants.URL_GET_PROOF_PRESENTATIONS}`
                : orgAgentType === OrgAgentType.SHARED
                  ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_PROOFS}`.replace('#', tenantId)
                  : null;
          break;
        }

        case 'get-proof-presentation-by-id': {
          url = orgAgentType === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_GET_PROOF_PRESENTATION_BY_ID}`.replace('#', proofPresentationId)
            : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_PROOFS_BY_PRESENTATION_ID}`.replace('#', proofPresentationId).replace('@', tenantId)
              : null;
          break;
        }

        case 'request-proof': {
          url = orgAgentType === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_SEND_PROOF_REQUEST}`
            : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_REQUEST_PROOF}`.replace('#', tenantId)
              : null;
          break;
        }

        case 'accept-presentation': {
          url = orgAgentType === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_VERIFY_PRESENTATION}`.replace('#', proofPresentationId)
            : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_ACCEPT_PRESENTATION}`.replace('@', proofPresentationId).replace('#', tenantId)
              : null;
          break;
        }

        case 'create-request-out-of-band': {
          url = orgAgentType === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_SEND_OUT_OF_BAND_CREATE_REQUEST}`
            : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_OUT_OF_BAND_CREATE_REQUEST}`.replace('#', tenantId)
              : null;
          break;
        }

        case 'get-verified-proof': {
          url = orgAgentType === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_PROOF_FORM_DATA}`.replace('#', proofPresentationId)
            : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_PROOF_FORM_DATA}`.replace('@', proofPresentationId).replace('#', tenantId)
              : null;
          break;
        }

        default: {
          break;
        }
      }

      if (!url) {
        throw new NotFoundException(ResponseMessages.verification.error.agentUrlNotFound);
      }

      return url;
    } catch (error) {
      this.logger.error(`Error in get agent url: ${JSON.stringify(error)}`);
      throw error;

    }
  }

  async getVerifiedProofdetails(proofId: string, orgId: string): Promise<IProofPresentationDetails[]> {
    try {
      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(orgId);
      const verificationMethodLabel = 'get-verified-proof';
      let credDefId;
      let schemaId;
      let certificate;
      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(
        verificationMethodLabel,
        orgAgentType,
        getAgentDetails?.agentEndPoint,
        getAgentDetails?.tenantId,
        '',
        proofId
      );

      const payload = { orgId, url };

      const getProofPresentationById = await this._getVerifiedProofDetails(payload);

      if (!getProofPresentationById?.response?.presentation) {
        throw new NotFoundException(ResponseMessages.verification.error.proofPresentationNotFound, {
          cause: new Error(),
          description: ResponseMessages.errorMessages.notFound
        });
      }

      const extractedDataArray: IProofPresentationDetails[] = [];

      // For Presentation Exchange format
      if (getProofPresentationById?.response?.request?.presentationExchange) {
        const presentationDefinition =
          getProofPresentationById?.response?.request?.presentationExchange?.presentation_definition;
        const verifiableCredentials =
          getProofPresentationById?.response?.presentation?.presentationExchange?.verifiableCredential;

        presentationDefinition?.input_descriptors.forEach((descriptor, index) => {
          const schemaId = descriptor?.schema[0]?.uri;
          const requestedAttributesForPresentationExchangeFormat = descriptor?.constraints?.fields[0]?.path;

          const verifiableCredential = verifiableCredentials[index]?.credentialSubject;

          if (getProofPresentationById?.response) {
            certificate =
              getProofPresentationById?.response?.presentation?.presentationExchange?.verifiableCredential[0].prettyVc
                ?.certificate;
          }
 
          if (
            requestedAttributesForPresentationExchangeFormat &&
            Array.isArray(requestedAttributesForPresentationExchangeFormat)
          ) {
            requestedAttributesForPresentationExchangeFormat.forEach((requestedAttributeKey) => {
              const attributeName =
                requestedAttributeKey?.match(ATTRIBUTE_NAME_REGEX)?.[1] || requestedAttributeKey?.split('.').pop();
              const attributeValue = verifiableCredential?.[attributeName];

              if (attributeName && attributeValue !== undefined) {
                const extractedData: IProofPresentationDetails = {
                  [attributeName]: attributeValue,
                  schemaId: schemaId || null,
                  certificateTemplate: certificate
                };

                extractedDataArray.push(extractedData);
              }
            });
          }
        });
      }
      // For Indy format
      if (getProofPresentationById?.response?.request?.indy) {
        const requestedAttributes = getProofPresentationById?.response?.request?.indy?.requested_attributes;
        const requestedPredicates = getProofPresentationById?.response?.request?.indy?.requested_predicates;
        const revealedAttrs = getProofPresentationById?.response?.presentation?.indy?.requested_proof?.revealed_attrs;

        if (0 !== Object.keys(requestedAttributes).length && 0 !== Object.keys(requestedPredicates).length) {
          for (const key in requestedAttributes) {
            if (requestedAttributes.hasOwnProperty(key)) {
              const requestedAttributeKey = requestedAttributes[key];
              const attributeName = requestedAttributeKey.name;

              if (requestedAttributeKey?.restrictions) {
                credDefId = requestedAttributeKey?.restrictions[0]?.cred_def_id;
                schemaId = requestedAttributeKey?.restrictions[0]?.schema_id;
              } else if (getProofPresentationById?.response?.presentation?.indy?.identifiers) {
                credDefId = getProofPresentationById?.response?.presentation?.indy?.identifiers[0].cred_def_id;
                schemaId = getProofPresentationById?.response?.presentation?.indy?.identifiers[0].schema_id;
              }

              if (revealedAttrs.hasOwnProperty(key)) {
                const extractedData: IProofPresentationDetails = {
                  [attributeName]: revealedAttrs[key]?.raw,
                  credDefId: credDefId || null,
                  schemaId: schemaId || null
                };
                extractedDataArray.push(extractedData);
              }
            }
          }

          for (const key in requestedPredicates) {
            if (requestedPredicates.hasOwnProperty(key)) {
              const attribute = requestedPredicates[key];

              const attributeName = attribute?.name;

              if (attribute?.restrictions) {
                credDefId = attribute?.restrictions[0]?.cred_def_id;
                schemaId = attribute?.restrictions[0]?.schema_id;
              }

              const extractedData: IProofPresentationDetails = {
                [attributeName]: `${attribute?.p_type}${attribute?.p_value}`,
                credDefId: credDefId || null,
                schemaId: schemaId || null
              };
              extractedDataArray.push(extractedData);
            }
          }
        } else if (0 !== Object.keys(requestedAttributes).length) {
          for (const key in requestedAttributes) {
            if (requestedAttributes.hasOwnProperty(key)) {
              const attribute = requestedAttributes[key];
              const attributeName = attribute.name;

              [credDefId, schemaId] = await this._schemaCredDefRestriction(attribute, getProofPresentationById);

              if (revealedAttrs.hasOwnProperty(key)) {
                const extractedData: IProofPresentationDetails = {
                  [attributeName]: revealedAttrs[key]?.raw,
                  credDefId: credDefId || null,
                  schemaId: schemaId || null
                };
                extractedDataArray.push(extractedData);
              }
            }
          }
        } else if (0 !== Object.keys(requestedPredicates).length) {
          for (const key in requestedPredicates) {
            if (requestedPredicates.hasOwnProperty(key)) {
              const attribute = requestedPredicates[key];
              const attributeName = attribute?.name;

              [credDefId, schemaId] = await this._schemaCredDefRestriction(attribute, getProofPresentationById);
              const extractedData: IProofPresentationDetails = {
                [attributeName]: `${attribute?.p_type}${attribute?.p_value}`,
                credDefId: credDefId || null,
                schemaId: schemaId || null
              };
              extractedDataArray.push(extractedData);
            }
          }
        } else {
          throw new InternalServerErrorException(ResponseMessages.errorMessages.serverError, {
            cause: new Error(),
            description: ResponseMessages.errorMessages.serverError
          });
        }
      }

      return extractedDataArray;
    } catch (error) {
      this.logger.error(`[getVerifiedProofDetails] - error in get verified proof details : ${JSON.stringify(error)}`);
      const errorStack = error?.response?.error?.reason;

      if (errorStack) {
        throw new RpcException({
          message: ResponseMessages.verification.error.verifiedProofNotFound,
          statusCode: error?.response?.status,
          error: errorStack
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async _schemaCredDefRestriction(attribute, getProofPresentationById): Promise<string[]> {
    let credDefId;
    let schemaId;

    if (attribute?.restrictions) {

      credDefId = attribute?.restrictions[0]?.cred_def_id;
      schemaId = attribute?.restrictions[0]?.schema_id;
    } else if (getProofPresentationById?.response?.presentation?.indy?.identifiers) {

      credDefId = getProofPresentationById?.response?.presentation?.indy?.identifiers[0].cred_def_id;
      schemaId = getProofPresentationById?.response?.presentation?.indy?.identifiers[0].schema_id;
    }

    return [credDefId, schemaId];
  }

  async _getVerifiedProofDetails(payload: IVerifiedProofData): Promise<{
    response;
  }> {
    try {

      //nats call in agent for fetch verified proof details
      const pattern = {
        cmd: 'get-agent-verified-proof-details'
      };

      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_getVerifiedProofDetails] - error in verified proof details : ${JSON.stringify(error)}`);
      throw error;
    }
  }


  async _getOrgAgentApiKey(orgId: string): Promise<string> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.verificationServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  verificationErrorHandling(error): void {
    if (!error && !error?.status && !error?.status?.message && !error?.status?.message?.error) {
      throw new RpcException(error.response ? error.response : error);
    } else {
       if (error?.message) {
        throw new RpcException({
          message: error?.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR
        });
       }
      throw new RpcException({
        message: error?.status?.message?.error?.reason ? error?.status?.message?.error?.reason : error?.status?.message?.error,
        statusCode: error?.status?.code
      });
    }
  }

  async natsCall(pattern: object, payload: object): Promise<{
    response: string;
  }> {
      return this.verificationServiceProxy
        .send<string>(pattern, payload)
        .pipe(
          map((response) => (
            {
              response
            }))
        )
        .toPromise()
        .catch(error => {
            this.logger.error(`catch: ${JSON.stringify(error)}`);
            throw new HttpException({         
                status: error.statusCode, 
                error: error.error,
                message: error.message
              }, error.error);
        });
    }
  
  async delay(ms: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async deleteVerificationRecords(orgId: string, userDetails: user): Promise<IVerificationRecords> {
    try {
      const deleteProofRecords = await this.verificationRepository.deleteVerificationRecordsByOrgId(orgId);

      if (0 === deleteProofRecords?.deleteResult?.count) {
        throw new NotFoundException(ResponseMessages.verification.error.verificationRecordsNotFound);
    }

    const statusCounts = {
        [VerificationProcessState.PROPOSAL_SENT]: 0,
        [VerificationProcessState.PROPOSAL_RECEIVED]: 0,
        [VerificationProcessState.REQUEST_SENT]: 0,
        [VerificationProcessState.REQUEST_RECEIVED]: 0,
        [VerificationProcessState.PRESENTATION_RECEIVED]: 0,
        [VerificationProcessState.PRESENTATION_SENT]: 0,
        [VerificationProcessState.DONE]: 0,
        [VerificationProcessState.DECLIEND]: 0,
        [VerificationProcessState.ABANDONED]: 0
    };

    await Promise.all(deleteProofRecords.recordsToDelete.map(async (record) => {
        statusCounts[record.state]++;
        }));

        const filteredStatusCounts = Object.fromEntries(
          Object.entries(statusCounts).filter(entry => 0 < entry[1])
        );
    
      const deletedVerificationData = {
        deletedProofRecordsCount : deleteProofRecords?.deleteResult?.count,
        deletedRecordsStatusCount : filteredStatusCounts
      }; 

      await this.userActivityRepository._orgDeletedActivity(orgId, userDetails, deletedVerificationData, RecordType.VERIFICATION_RECORD);

      return deleteProofRecords;    
    } catch (error) {
      this.logger.error(`[deleteVerificationRecords] - error in deleting verification records: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }
}             