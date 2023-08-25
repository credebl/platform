/* eslint-disable camelcase */
import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs/operators';
import { IGetAllProofPresentations, IGetProofPresentationById, IProofRequestPayload, IRequestProof, ISendProofRequestPayload, IVerifyPresentation, IWebhookProofPresentation } from './interfaces/verification.interface';
import { VerificationRepository } from './repositories/verification.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { presentations } from '@prisma/client';
import { OrgAgentType } from '@credebl/enum/enum';
import { ResponseMessages } from '@credebl/common/response-messages';
import * as QRCode from 'qrcode';
import { OutOfBandVerification } from '../templates/out-of-band-verification.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import * as uuid from 'uuid';

@Injectable()
export class VerificationService {

  private readonly logger = new Logger('VerificationService');

  constructor(
    @Inject('NATS_CLIENT') private readonly verificationServiceProxy: ClientProxy,
    private readonly verificationRepository: VerificationRepository

  ) { }

  /**
   * Get all proof presentations
   * @param user 
   * @param orgId 
   * @returns Get all proof presentation
   */
  async getProofPresentations(orgId: number, threadId: string): Promise<string> {
    try {
      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(orgId);

      const verificationMethodLabel = 'get-proof-presentation';
      let url;
      if (threadId) {
        url = await this.getAgentUrl(verificationMethodLabel, getAgentDetails?.orgAgentTypeId, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId, threadId);
      } else {
        url = await this.getAgentUrl(verificationMethodLabel, getAgentDetails?.orgAgentTypeId, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);
      }

      const payload = { apiKey: getAgentDetails.apiKey, url };
      const getProofPresentationsDetails = await this._getProofPresentations(payload);
      return getProofPresentationsDetails?.response;

    } catch (error) {
      this.logger.error(`[getProofPresentations] - error in get proof presentation : ${JSON.stringify(error)}`);
      throw new RpcException(error);
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

      const pattern = {
        cmd: 'agent-get-proof-presentations'
      };

      return this.verificationServiceProxy
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
      this.logger.error(`[_getProofPresentations] - error in get proof presentations : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Get proof presentation by id
   * @param id 
   * @param orgId 
   * @param user 
   * @returns Get proof presentation details
   */
  async getProofPresentationById(id: string, orgId: number): Promise<string> {
    try {
      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(orgId);

      const verificationMethodLabel = 'get-proof-presentation-by-id';
      const url = await this.getAgentUrl(verificationMethodLabel, getAgentDetails?.orgAgentTypeId, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId, '', id);

      const payload = { apiKey: '', url };

      const getProofPresentationById = await this._getProofPresentationById(payload);
      return getProofPresentationById?.response;
    } catch (error) {
      this.logger.error(`[getProofPresentationById] - error in get proof presentation by id : ${JSON.stringify(error)}`);
      throw new RpcException(error);
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

      return this.verificationServiceProxy
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
      this.logger.error(`[_getProofPresentationById] - error in get proof presentation by id : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Request proof presentation
   * @param requestProof 
   * @param user 
   * @returns Get requested proof presentation details
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

      const verificationMethodLabel = 'request-proof';
      const url = await this.getAgentUrl(verificationMethodLabel, getAgentDetails?.orgAgentTypeId, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);

      const payload = { apiKey: '', url, proofRequestPayload };

      const getProofPresentationById = await this._sendProofRequest(payload);
      return getProofPresentationById?.response;
    } catch (error) {
      this.logger.error(`[verifyPresentation] - error in verify presentation : ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  /**
   * Consume agent API for request proof presentation
   * @param payload 
   * @returns Get requested proof presentation details
   */
  async _sendProofRequest(payload: IProofRequestPayload): Promise<{
    response: string;
  }> {
    try {

      const pattern = {
        cmd: 'agent-send-proof-request'
      };

      return this.verificationServiceProxy
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
      this.logger.error(`[_sendProofRequest] - error in verify presentation : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Verify proof presentation
   * @param id 
   * @param orgId 
   * @param user 
   * @returns Get verified proof presentation details
   */
  async verifyPresentation(id: string, orgId: number): Promise<string> {
    try {
      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(orgId);
      const verificationMethodLabel = 'accept-presentation';
      const url = await this.getAgentUrl(verificationMethodLabel, getAgentDetails?.orgAgentTypeId, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId, '', id);

      const payload = { apiKey: '', url };
      const getProofPresentationById = await this._verifyPresentation(payload);
      return getProofPresentationById?.response;
    } catch (error) {
      this.logger.error(`[verifyPresentation] - error in verify presentation : ${JSON.stringify(error)}`);
      throw new RpcException(error);
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

      return this.verificationServiceProxy
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
      this.logger.error(`[_verifyPresentation] - error in verify presentation : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async webhookProofPresentation(id: string, proofPresentationPayload: IWebhookProofPresentation): Promise<presentations> {
    try {

      const proofPresentation = await this.verificationRepository.storeProofPresentation(id, proofPresentationPayload);
      return proofPresentation;

    } catch (error) {
      this.logger.error(`[webhookProofPresentation] - error in webhook proof presentation : ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  /**
   * Request out-of-band proof presentation
   * @param outOfBandRequestProof 
   * @returns Get requested proof presentation details
   */
  async sendOutOfBandPresentationRequest(outOfBandRequestProof: IRequestProof): Promise<boolean> {
    try {
      const comment = outOfBandRequestProof.comment ? outOfBandRequestProof.comment : '';

      let proofRequestPayload: ISendProofRequestPayload = {
        protocolVersion: '',
        comment: '',
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

      const { requestedAttributes, requestedPredicates } = await this._proofRequestPayload(outOfBandRequestProof);

      proofRequestPayload = {
        protocolVersion: outOfBandRequestProof.protocolVersion ? outOfBandRequestProof.protocolVersion : 'v1',
        comment,
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
        autoAcceptProof: outOfBandRequestProof.autoAcceptProof ? outOfBandRequestProof.autoAcceptProof : 'never'
      };

      const getAgentDetails = await this.verificationRepository.getAgentEndPoint(outOfBandRequestProof.orgId);
      const organizationDetails = await this.verificationRepository.getOrganization(outOfBandRequestProof.orgId);

      const verificationMethodLabel = 'create-request-out-of-band';
      const url = await this.getAgentUrl(verificationMethodLabel, getAgentDetails?.orgAgentTypeId, getAgentDetails?.agentEndPoint, getAgentDetails?.tenantId);

      const payload = { apiKey: '', url, proofRequestPayload };

      const getProofPresentation = await this._sendOutOfBandProofRequest(payload);

      if (!getProofPresentation) {
        throw new NotFoundException(ResponseMessages.verification.error.proofPresentationNotFound);
      }

      const invitationId = getProofPresentation?.response?.invitation['@id'];

      if (!invitationId) {
        throw new NotFoundException(ResponseMessages.verification.error.invitationNotFound);
      }

      let shortenedUrl;
      if (getAgentDetails?.tenantId) {
        shortenedUrl = `${getAgentDetails?.agentEndPoint}/multi-tenancy/url/${getAgentDetails?.tenantId}/${invitationId}`;
      } else {
        shortenedUrl = `${getAgentDetails?.agentEndPoint}/url/${invitationId}`;
      }

      const uniqueCID = uuid.v4();

      const qrCodeOptions: QRCode.QRCodeToDataURLOptions = {
        type: 'image/png'
      };

      const outOfBandIssuanceQrCode = await QRCode.toDataURL(shortenedUrl, qrCodeOptions);
      const platformConfigData = await this.verificationRepository.getPlatformConfigDetails();

      if (!platformConfigData) {
        throw new NotFoundException(ResponseMessages.verification.error.platformConfigNotFound);
      }

      const outOfBandVerification = new OutOfBandVerification();
      const emailData = new EmailDto();
      emailData.emailFrom = platformConfigData.emailFrom;
      emailData.emailTo = outOfBandRequestProof.emailId;
      emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Verification of Your Credentials Required`;
      emailData.emailHtml = await outOfBandVerification.outOfBandVerification(outOfBandRequestProof.emailId, uniqueCID, organizationDetails.name);
      emailData.emailAttachments = [
        {
          filename: 'qrcode.png',
          content: outOfBandIssuanceQrCode.split(';base64,')[1],
          contentType: 'image/png',
          disposition: 'attachment'
        }
      ];
      const isEmailSent = await sendEmail(emailData);

      if (isEmailSent) {
        return isEmailSent;
      } else {
        throw new InternalServerErrorException(ResponseMessages.verification.error.emailSend);
      }

    } catch (error) {
      this.logger.error(`[sendOutOfBandPresentationRequest] - error in out of band proof request : ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
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

      return this.verificationServiceProxy
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

        requestedAttributes = {};
        for (const [index, attribute] of proofRequestpayload.attributes.entries()) {
          const attributeElement = attribute.attributeName;
          const attributeReferent = `additionalProp${index + 1}`;

          if (!attribute.condition && !attribute.value) {
            const keys = Object.keys(requestedAttributes);

            if (0 < keys.length) {
              let attributeFound = false;

              for (const attr of keys) {
                if (
                  requestedAttributes[attr].restrictions.some(
                    res => res.schema_id === proofRequestpayload.attributes[index].schemaId
                  )
                ) {
                  requestedAttributes[attr].name.push(attributeElement);
                  attributeFound = true;
                }

                if (attr === keys[keys.length - 1] && !attributeFound) {
                  requestedAttributes[attributeReferent] = {
                    name: attributeElement,
                    restrictions: [
                      {
                        cred_def_id: proofRequestpayload.attributes[index].credDefId
                          ? proofRequestpayload.attributes[index].credDefId
                          : undefined,
                        schema_id: proofRequestpayload.attributes[index].schemaId
                      }
                    ]
                  };
                }
              }
            } else {
              requestedAttributes[attributeReferent] = {
                name: attributeElement,
                restrictions: [
                  {
                    cred_def_id: proofRequestpayload.attributes[index].credDefId
                      ? proofRequestpayload.attributes[index].credDefId
                      : undefined,
                    schema_id: proofRequestpayload.attributes[index].schemaId
                  }
                ]
              };
            }
          } else {
            if (isNaN(parseInt(attribute.value))) {
              throw new BadRequestException(
                ResponseMessages.verification.error.predicatesValueNotNumber
              );
            }

            requestedPredicates[attributeReferent] = {
              p_type: attribute.condition,
              restrictions: [
                {
                  cred_def_id: proofRequestpayload.attributes[index].credDefId
                    ? proofRequestpayload.attributes[index].credDefId
                    : undefined,
                  schema_id: proofRequestpayload.attributes[index].schemaId
                }
              ],
              name: attributeElement,
              p_value: parseInt(attribute.value)
            };
          }
        }

        return {
          requestedAttributes,
          requestedPredicates
        };
      } else {
        throw new BadRequestException(
          ResponseMessages.verification.error.schemaIdNotFound
        );
      }
    } catch (error) {
      this.logger.error(`[proofRequestPayload] - error in proof request payload : ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  /**
  * Description: Fetch agent url 
  * @param referenceId 
  * @returns agent URL
  */
  async getAgentUrl(
    verificationMethodLabel: string,
    orgAgentTypeId: number,
    agentEndPoint: string,
    tenantId: string,
    threadId?: string,
    proofPresentationId?: string
  ): Promise<string> {
    try {

      let url;
      switch (verificationMethodLabel) {
        case 'get-proof-presentation': {
          url = orgAgentTypeId === OrgAgentType.DEDICATED && threadId
            ? `${agentEndPoint}${CommonConstants.URL_GET_PROOF_PRESENTATIONS}?threadId=${threadId}`
            : orgAgentTypeId === OrgAgentType.SHARED && threadId
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_PROOFS}?threadId=${threadId}`.replace('#', tenantId)
              : orgAgentTypeId === OrgAgentType.DEDICATED
                ? `${agentEndPoint}${CommonConstants.URL_GET_PROOF_PRESENTATIONS}`
                : orgAgentTypeId === OrgAgentType.SHARED
                  ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_PROOFS}`.replace('#', tenantId)
                  : null;
          break;
        }

        case 'get-proof-presentation-by-id': {
          url = orgAgentTypeId === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_GET_PROOF_PRESENTATION_BY_ID}`.replace('#', proofPresentationId)
            : orgAgentTypeId === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_PROOFS_BY_PRESENTATION_ID}`.replace('#', proofPresentationId).replace('@', tenantId)
              : null;
          break;
        }

        case 'request-proof': {
          url = orgAgentTypeId === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_SEND_PROOF_REQUEST}`
            : orgAgentTypeId === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_REQUEST_PROOF}`.replace('#', tenantId)
              : null;
          break;
        }

        case 'accept-presentation': {
          url = orgAgentTypeId === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_VERIFY_PRESENTATION}`.replace('#', proofPresentationId)
            : orgAgentTypeId === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_ACCEPT_PRESENTATION}`.replace('@', proofPresentationId).replace('#', tenantId)
              : null;
          break;
        }

        case 'create-request-out-of-band': {
          url = orgAgentTypeId === OrgAgentType.DEDICATED
            ? `${agentEndPoint}${CommonConstants.URL_SEND_OUT_OF_BAND_CREATE_REQUEST}`
            : orgAgentTypeId === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_OUT_OF_BAND_CREATE_REQUEST}`.replace('#', tenantId)
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
}
