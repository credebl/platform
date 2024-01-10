/* eslint-disable camelcase */
import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs/operators';
import { IGetAllProofPresentations, IProofRequestSearchCriteria, IGetProofPresentationById, IProofPresentation, IProofRequestPayload, IRequestProof, ISendProofRequestPayload, IVerifyPresentation, IVerifiedProofData } from './interfaces/verification.interface';
import { VerificationRepository } from './repositories/verification.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { org_agents, organisation, presentations } from '@prisma/client';
import { OrgAgentType } from '@credebl/enum/enum';
import { ResponseMessages } from '@credebl/common/response-messages';
import * as QRCode from 'qrcode';
import { OutOfBandVerification } from '../templates/out-of-band-verification.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IProofPresentationDetails, IProofPresentationList } from '@credebl/common/interfaces/verification.interface';

@Injectable()
export class VerificationService {

  private readonly logger = new Logger('VerificationService');

  constructor(
    @Inject('NATS_CLIENT') private readonly verificationServiceProxy: ClientProxy,
    private readonly verificationRepository: VerificationRepository,
    private readonly outOfBandVerification: OutOfBandVerification,
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
        data: getProofRequestsList.proofRequestsList
      };

        return proofPresentationsResponse;
     } catch (error) {

        this.logger.error(
       `[getProofRequests] [NATS call]- error in fetch proof requests details : ${JSON.stringify(error)}`
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
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId, '', proofId);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const payload = { apiKey, url };

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
  async sendProofRequest(requestProof: IRequestProof): Promise<string> {
    try {
      const comment = requestProof.comment ? requestProof.comment : '';

      let proofRequestPayload: ISendProofRequestPayload = {
        protocolVersion: '',
        comment: '',
        connectionId: '',
        proofFormats: {
          indy: {
            name: '',
            requested_attributes: {},
            requested_predicates: {},
            version: ''
          }
        },
        autoAcceptProof: ''
      };

      const { requestedAttributes, requestedPredicates } = await this._proofRequestPayload(requestProof);

      proofRequestPayload = {
        protocolVersion: requestProof.protocolVersion ? requestProof.protocolVersion : 'v1',
        comment,
        connectionId: requestProof.connectionId,
        proofFormats: {
          indy: {
            name: 'Proof Request',
            version: '1.0',
            // eslint-disable-next-line camelcase
            requested_attributes: requestedAttributes,
            // eslint-disable-next-line camelcase
            requested_predicates: requestedPredicates
          }
        },
        autoAcceptProof: requestProof.autoAcceptProof ? requestProof.autoAcceptProof : 'never'
      };

      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(requestProof.orgId);

      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      const verificationMethodLabel = 'request-proof';
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      this.logger.log(`cachedApiKey----${apiKey}`);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(requestProof.orgId);
      }
      const payload = { apiKey, url, proofRequestPayload };

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
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);

      const verificationMethod = 'accept-presentation';
      
      const url = await this.getAgentUrl(verificationMethod, orgAgentTypeData, getAgentData?.agentEndPoint, getAgentData?.tenantId, '', proofId);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const payload = { apiKey, url };
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

  async webhookProofPresentation(proofPresentationPayload: IProofPresentation): Promise<presentations> {
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
  async sendOutOfBandPresentationRequest(outOfBandRequestProof: IRequestProof): Promise<boolean> {
    try {
      const comment = outOfBandRequestProof.comment || '';
      const protocolVersion = outOfBandRequestProof.protocolVersion || 'v1';
      const autoAcceptProof = outOfBandRequestProof.autoAcceptProof || 'never';

      const { requestedAttributes, requestedPredicates } = await this._proofRequestPayload(outOfBandRequestProof);


      const [getAgentDetails, organizationDetails] = await Promise.all([
        this.verificationRepository.getAgentEndPoint(outOfBandRequestProof.orgId),
        this.verificationRepository.getOrganization(outOfBandRequestProof.orgId)
      ]);

      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      const verificationMethodLabel = 'create-request-out-of-band';
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);
      this.logger.log(`cachedApiKey----${apiKey}`);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(outOfBandRequestProof.orgId);
      }
      const payload: IProofRequestPayload
        = {
        apiKey,
        url,
        proofRequestPayload: {
          protocolVersion,
          comment,
          label: organizationDetails?.name,
          proofFormats: {
            indy: {
              name: 'Proof Request',
              version: '1.0',
              requested_attributes: requestedAttributes,
              requested_predicates: requestedPredicates
            }
          },
          autoAcceptProof
        }
      };

      const batchSize = 100; // Define the batch size according to your needs
      const { emailId } = outOfBandRequestProof; // Assuming it's an array
      await this.sendEmailInBatches(payload, emailId, getAgentDetails, organizationDetails, batchSize);
      return true;
    } catch (error) {
      this.logger.error(`[sendOutOfBandPresentationRequest] - error in out of band proof request : ${error.message}`);
      this.verificationErrorHandling(error);
    }
  }

  async sendEmailInBatches(payload: IProofRequestPayload, emailIds: string[] | string, getAgentDetails: org_agents, organizationDetails: organisation, batchSize: number): Promise<void> {
    const accumulatedErrors = [];

    if (Array.isArray(emailIds)) {

      for (let i = 0; i < emailIds.length; i += batchSize) {
        const batch = emailIds.slice(i, i + batchSize);
        const emailPromises = batch.map(async email => {
          try {
            await this.sendOutOfBandProofRequest(payload, email, getAgentDetails, organizationDetails);
          } catch (error) {
            accumulatedErrors.push(error);
          }
        });

        await Promise.all(emailPromises);
      }
    } else {
      await this.sendOutOfBandProofRequest(payload, emailIds, getAgentDetails, organizationDetails);
    }

    if (0 < accumulatedErrors.length) {
      this.logger.error(accumulatedErrors);
      throw new Error(ResponseMessages.verification.error.emailSend);
    }
  }


  async sendOutOfBandProofRequest(payload: IProofRequestPayload, email: string, getAgentDetails: org_agents, organizationDetails: organisation): Promise<boolean> {
    let agentApiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
    this.logger.log(`cachedApiKey----${agentApiKey}`);
    if (!agentApiKey || null === agentApiKey || undefined === agentApiKey) {
      agentApiKey = await this._getOrgAgentApiKey(getAgentDetails.orgId);
    }
    payload.apiKey = agentApiKey;
    const getProofPresentation = await this._sendOutOfBandProofRequest(payload);

    if (!getProofPresentation) {
      throw new Error(ResponseMessages.verification.error.proofPresentationNotFound);
    }

    const invitationId = getProofPresentation?.response?.invitation['@id'];

    if (!invitationId) {
      throw new Error(ResponseMessages.verification.error.invitationNotFound);
    }

    const shortenedUrl = getAgentDetails?.tenantId
      ? `${getAgentDetails?.agentEndPoint}/multi-tenancy/url/${getAgentDetails?.tenantId}/${invitationId}`
      : `${getAgentDetails?.agentEndPoint}/url/${invitationId}`;

    const qrCodeOptions: QRCode.QRCodeToDataURLOptions = { type: 'image/png' };
    const outOfBandVerificationQrCode = await QRCode.toDataURL(shortenedUrl, qrCodeOptions);

    const platformConfigData = await this.verificationRepository.getPlatformConfigDetails();

    if (!platformConfigData) {
      throw new Error(ResponseMessages.verification.error.platformConfigNotFound);
    }

    this.emailData.emailFrom = platformConfigData.emailFrom;
    this.emailData.emailTo = email;
    this.emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Verification of Your Credentials`;
    this.emailData.emailHtml = await this.outOfBandVerification.outOfBandVerification(email, organizationDetails.name, outOfBandVerificationQrCode);
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

    return isEmailSent;
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
      const attributeWithSchemaIdExists = proofRequestpayload.attributes.some(attribute => attribute.schemaId);
      if (attributeWithSchemaIdExists) {
        requestedAttributes = Object.fromEntries(proofRequestpayload.attributes.map((attribute, index) => {

          const attributeElement = attribute.attributeName;
          const attributeReferent = `additionalProp${index + 1}`;

          if (!attribute.condition && !attribute.value) {

            const keys = Object.keys(requestedAttributes);

            if (0 < keys.length) {
              let attributeFound = false;

              for (const attr of keys) {
                if (
                  requestedAttributes[attr].restrictions.some(res => res.schema_id) ===
                  proofRequestpayload.attributes[index].schemaId
                ) {
                  requestedAttributes[attr].name.push(attributeElement);
                  attributeFound = true;
                }

                if (attr === keys[keys.length - 1] && !attributeFound) {
                  requestedAttributes[attributeReferent] = {
                    name: attributeElement,
                    restrictions: [
                      {
                        cred_def_id: proofRequestpayload.attributes[index].credDefId ? proofRequestpayload.attributes[index].credDefId : undefined,
                        schema_id: proofRequestpayload.attributes[index].schemaId
                      }
                    ]
                  };
                }
              }
            } else {
              return [
                attributeReferent,
                {
                  name: attributeElement,
                  restrictions: [
                    {
                      cred_def_id: proofRequestpayload.attributes[index].credDefId ? proofRequestpayload.attributes[index].credDefId : undefined,
                      schema_id: proofRequestpayload.attributes[index].schemaId
                    }
                  ]
                }
              ];
            }
          } else {
            requestedPredicates[attributeReferent] = {
              p_type: attribute.condition,
              restrictions: [
                {
                  cred_def_id: proofRequestpayload.attributes[index].credDefId ? proofRequestpayload.attributes[index].credDefId : undefined,
                  schema_id: proofRequestpayload.attributes[index].schemaId
                }
              ],
              name: attributeElement,
              p_value: parseInt(attribute.value)
            };
          }

          return [attributeReferent];
        }));

        return {
          requestedAttributes,
          requestedPredicates
        };
      } else {
        throw new BadRequestException(ResponseMessages.verification.error.schemaIdNotFound);
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

      const orgAgentType = await this.verificationRepository.getOrgAgentType(getAgentDetails?.orgAgentTypeId);
      const url = await this.getAgentUrl(verificationMethodLabel, orgAgentType, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId, '', proofId);
      let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      this.logger.log(`cachedApiKey----${apiKey}`);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);
      }
      const payload = { apiKey, url };

      const getProofPresentationById = await this._getVerifiedProofDetails(payload);
      if (!getProofPresentationById?.response?.presentation) {
        throw new NotFoundException(ResponseMessages.verification.error.proofPresentationNotFound, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.notFound
        });
        }
      const requestedAttributes = getProofPresentationById?.response?.request?.indy?.requested_attributes;
      const requestedPredicates = getProofPresentationById?.response?.request?.indy?.requested_predicates;
      const revealedAttrs = getProofPresentationById?.response?.presentation?.indy?.requested_proof?.revealed_attrs;

      const extractedDataArray: IProofPresentationDetails[] = [];

      if (requestedAttributes && requestedPredicates) {

        for (const key in requestedAttributes) {

          if (requestedAttributes.hasOwnProperty(key)) {
            const requestedAttributeKey = requestedAttributes[key];
            const attributeName = requestedAttributeKey.name;
            const credDefId = requestedAttributeKey?.restrictions[0]?.cred_def_id;
            const schemaId = requestedAttributeKey?.restrictions[0]?.schema_id;

            if (revealedAttrs.hasOwnProperty(key)) {
              const extractedData: IProofPresentationDetails = {
                [attributeName]: revealedAttrs[key]?.raw,
                'credDefId': credDefId || null,
                'schemaId': schemaId || null
              };
              extractedDataArray.push(extractedData);
            }
          }
        }

        for (const key in requestedPredicates) {
          if (requestedPredicates.hasOwnProperty(key)) {
            const attribute = requestedPredicates[key];
            const attributeName = attribute?.name;
            const credDefId = attribute?.restrictions[0]?.cred_def_id;
            const schemaId = attribute?.restrictions[0]?.schema_id;

            const extractedData: IProofPresentationDetails = {
              [attributeName]: `${attribute?.p_type}${attribute?.p_value}`,
              'credDefId': credDefId || null,
              'schemaId': schemaId || null
            };
            extractedDataArray.push(extractedData);
          }
        }

      } else if (requestedAttributes) {
        for (const key in requestedAttributes) {

          if (requestedAttributes.hasOwnProperty(key)) {
            const attribute = requestedAttributes[key];
            const attributeName = attribute.name;
            const credDefId = attribute?.restrictions[0]?.cred_def_id;
            const schemaId = attribute?.restrictions[0]?.schema_id;

            if (revealedAttrs.hasOwnProperty(key)) {
              const extractedData: IProofPresentationDetails = {
                [attributeName]: revealedAttrs[key]?.raw,
                'credDefId': credDefId || null,
                'schemaId': schemaId || null
              };
              extractedDataArray.push(extractedData);
            }
          }
        }
      } else if (requestedPredicates) {
        for (const key in requestedPredicates) {

          if (requestedPredicates.hasOwnProperty(key)) {
            const attribute = requestedPredicates[key];
            const attributeName = attribute?.name;
            const credDefId = attribute?.restrictions[0]?.cred_def_id;
            const schemaId = attribute?.restrictions[0]?.schema_id;

            const extractedData: IProofPresentationDetails = {
              [attributeName]: `${requestedPredicates?.p_type}${requestedPredicates?.p_value}`,
              'credDefId': credDefId || null,
              'schemaId': schemaId || null
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
  
}          