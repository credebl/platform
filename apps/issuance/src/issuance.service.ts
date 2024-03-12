/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { BadRequestException, ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { IssuanceRepository } from './issuance.repository';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
// import { ClientDetails, FileUploadData, ICredentialAttributesInterface, ImportFileDetails, OutOfBandCredentialOfferPayload, PreviewRequest, SchemaDetails } from '../interfaces/issuance.interfaces';
import { CredentialOffer, FileUploadData, IAttributes, IClientDetails, ICreateOfferResponse, IIssuance, IIssueData, IPattern, ISendOfferNatsPayload, ImportFileDetails, IssueCredentialWebhookPayload, OutOfBandCredentialOfferPayload, PreviewRequest, SchemaDetails, SendEmailCredentialOffer } from '../interfaces/issuance.interfaces';
import { OrgAgentType } from '@credebl/enum/enum';
// import { platform_config } from '@prisma/client';
import * as QRCode from 'qrcode';
import { OutOfBandIssuance } from '../templates/out-of-band-issuance.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import { join } from 'path';
import { parse } from 'json2csv';
import { checkIfFileOrDirectoryExists, createFile } from '../../api-gateway/src/helper-files/file-operation.helper';
import { parse as paParse } from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { orderValues, paginator } from '@credebl/common/common.utils';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FileUploadStatus, FileUploadType } from 'apps/api-gateway/src/enum';
import { AwsService } from '@credebl/aws';
import { io } from 'socket.io-client';
import { IIssuedCredentialSearchParams, IssueCredentialType } from 'apps/api-gateway/src/issuance/interfaces';
import { IIssuedCredential } from '@credebl/common/interfaces/issuance.interface';
import { OOBIssueCredentialDto } from 'apps/api-gateway/src/issuance/dtos/issuance.dto';
import { agent_invitations, organisation } from '@prisma/client';

@Injectable()
export class IssuanceService {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceServiceProxy: ClientProxy,
    private readonly commonService: CommonService,
    private readonly issuanceRepository: IssuanceRepository,
    private readonly outOfBandIssuance: OutOfBandIssuance,
    private readonly emailData: EmailDto
  ) { }


  async sendCredentialCreateOffer(payload: IIssuance): Promise<ICreateOfferResponse> {

    try {
      const { orgId, credentialDefinitionId, comment, connectionId, attributes } = payload || {};

      const schemaResponse: SchemaDetails = await this.issuanceRepository.getCredentialDefinitionDetails(
        credentialDefinitionId
      );

      if (schemaResponse?.attributes) {
        const schemaResponseError = [];
        const attributesArray: IAttributes[] = JSON.parse(schemaResponse.attributes);

        attributesArray.forEach((attribute) => {
          if (attribute.attributeName && attribute.isRequired) {
            
            payload.attributes.map((attr) => { 
              if (attr.name === attribute.attributeName && attribute.isRequired && !attr.value) {
                schemaResponseError.push(
                  `Attribute ${attribute.attributeName} is required`
                );
              }
              return true;
             });
          }
        });
        if (0 < schemaResponseError.length) {
            throw new BadRequestException(schemaResponseError);
          
        }

      }

      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);

      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const { agentEndPoint } = agentDetails;

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);

      if (!orgAgentType) {
        throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
      }

      const issuanceMethodLabel = 'create-offer';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId);

      const issueData: IIssueData = {
        protocolVersion: 'v1',
        connectionId,
        credentialFormats: {
          indy: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            attributes: (attributes).map(({ isRequired, ...rest }) => rest),
            credentialDefinitionId
            
          }
        },
        autoAcceptCredential: autoAcceptCredential || 'always',
        comment
      };

      const credentialCreateOfferDetails: ICreateOfferResponse = await this._sendCredentialCreateOffer(issueData, url, orgId);

      if (credentialCreateOfferDetails && 0 < Object.keys(credentialCreateOfferDetails).length) {
        delete credentialCreateOfferDetails._tags;
        delete credentialCreateOfferDetails.metadata;
        delete credentialCreateOfferDetails.credentials;
        delete credentialCreateOfferDetails.credentialAttributes;
        delete credentialCreateOfferDetails.autoAcceptCredential;
      }

      return credentialCreateOfferDetails;
    } catch (error) {
      this.logger.error(`[sendCredentialCreateOffer] - error in create credentials : ${JSON.stringify(error)}`);
      const errorStack = error?.status?.message?.error?.reason || error?.status?.message?.error;
      if (errorStack) {
        throw new RpcException({
          error: errorStack?.message ? errorStack?.message : errorStack,
          statusCode: error?.status?.code,
          message: ResponseMessages.issuance.error.unableToCreateOffer
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async sendCredentialOutOfBand(payload: OOBIssueCredentialDto): Promise<{ response: object }> {
    try {
      const { orgId, credentialDefinitionId, comment, attributes, protocolVersion } = payload;

      const { orgId, credentialDefinitionId, comment, attributes, protocolVersion, credential, options, credentialType, isShortenUrl, reuseConnection } = payload;
      if (credentialType === IssueCredentialType.INDY) {
        const schemadetailsResponse: SchemaDetails = await this.issuanceRepository.getCredentialDefinitionDetails(
          credentialDefinitionId
        );

      if (schemadetailsResponse?.attributes) {
        const schemadetailsResponseError = [];
        const attributesArray: IAttributes[] = JSON.parse(schemadetailsResponse.attributes);

        attributesArray.forEach((attribute) => {
          if (attribute.attributeName && attribute.isRequired) {
            
            payload.attributes.map((attr) => { 
              if (attr.name === attribute.attributeName && attribute.isRequired && !attr.value) {
                schemadetailsResponseError.push(
                  `Attribute '${attribute.attributeName}' is required but has an empty value.`
                );
              }
              return true;
             });
          }
        });
        if (0 < schemadetailsResponseError.length) {
          throw new BadRequestException(schemadetailsResponseError);
        }
      }

      }

      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      let recipientKey: string | undefined;
      if (true === reuseConnection) {
        const data: agent_invitations[] = await this.issuanceRepository.getRecipientKeyByOrgId(orgId);
         if (data && 0 < data.length) {
          const [firstElement] = data;
          recipientKey = firstElement?.recipientKey ?? undefined;
      }
      }
      const { agentEndPoint, organisation } = agentDetails;

      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);

      const issuanceMethodLabel = 'create-offer-oob';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId);


      let issueData;
      if (credentialType === IssueCredentialType.INDY) {

        issueData = {
          protocolVersion: protocolVersion || 'v1',
          credentialFormats: {
            indy: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              attributes: (attributes).map(({ isRequired, ...rest }) => rest),
              credentialDefinitionId
            }
          },
          autoAcceptCredential: payload.autoAcceptCredential || 'always',
          goalCode: payload.goalCode || undefined,
          parentThreadId: payload.parentThreadId || undefined,
          willConfirm: payload.willConfirm || undefined,
          imageUrl: organisation?.logoUrl || payload?.imageUrl || undefined,
          label: organisation?.name,
          comment: comment || '',
          recipientKey:recipientKey || undefined
        };

    }

      if (credentialType === IssueCredentialType.JSONLD) {
        issueData = {
          protocolVersion: protocolVersion || 'v2',
          credentialFormats: {
            jsonld: {
              credential,
              options
            }
          },
          autoAcceptCredential: payload.autoAcceptCredential || 'always',
          goalCode: payload.goalCode || undefined,
          parentThreadId: payload.parentThreadId || undefined,
          willConfirm: payload.willConfirm || undefined,
          imageUrl: organisation?.logoUrl || payload?.imageUrl || undefined,
          label: organisation?.name,
          comment: comment || '',
          recipientKey:recipientKey || undefined
        };
      }
      const credentialCreateOfferDetails = await this._outOfBandCredentialOffer(issueData, url, orgId);
      if (isShortenUrl) {
        const invitationUrl: string = credentialCreateOfferDetails.response?.invitationUrl;
        const url: string = await this.storeIssuanceObjectReturnUrl(invitationUrl);
        credentialCreateOfferDetails.response['invitationUrl'] = url;
      }
      return credentialCreateOfferDetails;
    } catch (error) {
      this.logger.error(`[storeIssuanceObjectReturnUrl] - error in create credentials : ${JSON.stringify(error)}`);

      const errorStack = error?.status?.message?.error;
      if (errorStack) {
        throw new RpcException({
          message: errorStack?.reason ? errorStack?.reason : errorStack,
          statusCode: error?.status?.code
        });

      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async storeIssuanceObjectReturnUrl(storeObj: string): Promise<string> {
    try {
    // Set default to false, since currently our invitation are not multi-use
    const persistent: boolean = false;
    //nats call in agent-service to create an invitation url
    const pattern = { cmd: 'store-object-return-url' };
    const payload = { persistent, storeObj };
    const message = await this.natsCall(pattern, payload);
    return message.response;
  } catch (error) {
    this.logger.error(`[storeIssuanceObjectReturnUrl] [NATS call]- error in storing object and returning url : ${JSON.stringify(error)}`);
    throw error;
  }
  }

  // Created this function to avoid the impact of actual "natsCall" function for other operations
  // Once implement this for all component then we'll remove the duplicate function
  async natsCallAgent(pattern: IPattern, payload: ISendOfferNatsPayload): Promise<ICreateOfferResponse> {
    try {
      const createOffer = await this.issuanceServiceProxy
        .send<ICreateOfferResponse>(pattern, payload)
        .toPromise()
        .catch(error => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            }, error.error);
        });
      return createOffer;
    } catch (error) {
      this.logger.error(`[natsCall] - error in nats call : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async natsCall(pattern: object, payload: object): Promise<{
    response: string;
  }> {
    try {
      return this.issuanceServiceProxy
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
      this.logger.error(`[natsCall] - error in nats call : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _sendCredentialCreateOffer(issueData: IIssueData, url: string, orgId: string): Promise<ICreateOfferResponse> {
    try {
      const pattern = { cmd: 'agent-send-credential-create-offer' };
      const payload: ISendOfferNatsPayload = { issueData, url, orgId };
      return await this.natsCallAgent(pattern, payload);
    } catch (error) {
      this.logger.error(`[_sendCredentialCreateOffer] [NATS call]- error in create credentials : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getIssueCredentials(
    user: IUserRequest,
    orgId: string,
    issuedCredentialsSearchCriteria: IIssuedCredentialSearchParams
  ): Promise<IIssuedCredential> {
    try {
      const getIssuedCredentialsList = await this.issuanceRepository.getAllIssuedCredentials(
        user,
        orgId,
        issuedCredentialsSearchCriteria
      );
      const issuedCredentialsResponse: IIssuedCredential = {
        totalItems: getIssuedCredentialsList.issuedCredentialsCount,
        hasNextPage:
          issuedCredentialsSearchCriteria.pageSize * issuedCredentialsSearchCriteria.pageNumber < getIssuedCredentialsList.issuedCredentialsCount,
        hasPreviousPage: 1 < issuedCredentialsSearchCriteria.pageNumber,
        nextPage: Number(issuedCredentialsSearchCriteria.pageNumber) + 1,
        previousPage: issuedCredentialsSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(getIssuedCredentialsList.issuedCredentialsCount / issuedCredentialsSearchCriteria.pageSize),
        data: getIssuedCredentialsList.issuedCredentialsList
      };

      if (0 === getIssuedCredentialsList?.issuedCredentialsCount) {
        throw new NotFoundException(ResponseMessages.issuance.error.credentialsNotFound);
      }

      return issuedCredentialsResponse;
    } catch (error) {
      this.logger.error(`Error in fetching issued credentials by org id: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getIssueCredentials(url: string, apiKey: string): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-all-issued-credentials' };
      const payload = { url, apiKey };
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_getIssueCredentials] [NATS call]- error in fetch credentials : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getIssueCredentialsbyCredentialRecordId(user: IUserRequest, credentialRecordId: string, orgId: string): Promise<string> {
    try {

      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      // const platformConfig: platform_config = await this.issuanceRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const issuanceMethodLabel = 'get-issue-credential-by-credential-id';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId, credentialRecordId);


      const createConnectionInvitation = await this._getIssueCredentialsbyCredentialRecordId(url, orgId);
      return createConnectionInvitation?.response;
    } catch (error) {
      this.logger.error(`[getIssueCredentialsbyCredentialRecordId] - error in get credentials : ${JSON.stringify(error)}`);
      if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
        throw new RpcException({
          message: error?.status?.message?.error?.reason ? error?.status?.message?.error?.reason : error?.status?.message?.error,
          statusCode: error?.status?.code
        });

      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async getIssueCredentialWebhook(payload: IssueCredentialWebhookPayload): Promise<object> {
    try {
      const agentDetails = await this.issuanceRepository.saveIssuedCredentialDetails(payload);
      return agentDetails;
    } catch (error) {
      this.logger.error(`[getIssueCredentialsbyCredentialRecordId] - error in get credentials : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getIssueCredentialsbyCredentialRecordId(url: string, orgId: string): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-issued-credentials-by-credentialDefinitionId' };
      const payload = { url, orgId };
      return await this.natsCall(pattern, payload);

    } catch (error) {
      this.logger.error(`[_getIssueCredentialsbyCredentialRecordId] [NATS call]- error in fetch credentials : ${JSON.stringify(error)}`);
      throw error;
    }
  }

async outOfBandCredentialOffer(outOfBandCredential: OutOfBandCredentialOfferPayload): Promise<boolean> {
  try {
    const {
      credentialOffer,
      comment,
      credentialDefinitionId,
      orgId,
      protocolVersion,
      attributes,
      emailId,
      credentialType
    } = outOfBandCredential;

    if (IssueCredentialType.INDY === credentialType) {
      const schemaResponse: SchemaDetails = await this.issuanceRepository.getCredentialDefinitionDetails(
        credentialDefinitionId
      );

      let attributesArray: IAttributes[] = [];
      if (schemaResponse?.attributes) {
        attributesArray = JSON.parse(schemaResponse.attributes);
      }

      if (0 < attributes?.length) {
        const attrError = [];
        attributesArray.forEach((schemaAttribute, i) => {
          if (schemaAttribute.isRequired) {
            const attribute = attributes.find((attribute) => attribute.name === schemaAttribute.attributeName);
            if (!attribute?.value) {
              attrError.push(`attributes.${i}.Attribute ${schemaAttribute.attributeName} is required`);
            }
          }
        });
        if (0 < attrError.length) {
          throw new BadRequestException(attrError);
        }
      }
      if (0 < credentialOffer?.length) {
        const credefError = [];
        credentialOffer.forEach((credentialAttribute, index) => {
          attributesArray.forEach((schemaAttribute, i) => {
            const attribute = credentialAttribute.attributes.find(
              (attribute) => attribute.name === schemaAttribute.attributeName
            );

            if (schemaAttribute.isRequired && !attribute?.value) {
              credefError.push(
                `credentialOffer.${index}.attributes.${i}.Attribute ${schemaAttribute.attributeName} is required`
              );
            }
          });
        });
        if (0 < credefError.length) {
          throw new BadRequestException(credefError);
        }
      }
    }

    const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);

    const { organisation } = agentDetails;
    if (!agentDetails) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);

    const issuanceMethodLabel = 'create-offer-oob';
    const url = await this.getAgentUrl(
      issuanceMethodLabel,
      orgAgentType,
      agentDetails.agentEndPoint,
      agentDetails.tenantId
    );
    const organizationDetails = await this.issuanceRepository.getOrganization(orgId);

    if (!organizationDetails) {
      throw new NotFoundException(ResponseMessages.issuance.error.organizationNotFound);
    }

    const errors = [];
    let credentialOfferResponse;
    const arraycredentialOfferResponse = [];
    const sendEmailCredentialOffer: {
      iterator: CredentialOffer;
      emailId: string;
      index: number;
      credentialType: IssueCredentialType;
      protocolVersion: string;
      attributes: IAttributes[];
      credentialDefinitionId: string;
      outOfBandCredential: OutOfBandCredentialOfferPayload;
      comment: string;
      organisation: organisation;
      errors: string[];
      url: string;
      orgId: string;
      organizationDetails: organisation;
    } = {
      credentialType,
      protocolVersion,
      attributes,
      credentialDefinitionId,
      outOfBandCredential,
      comment,
      organisation,
      errors,
      url,
      orgId,
      organizationDetails,
      iterator: undefined,
      emailId: emailId || '',
      index: 0
    };

    if (credentialOffer) {

        for (const [index, iterator] of credentialOffer.entries()) {
          sendEmailCredentialOffer['iterator'] = iterator;
          sendEmailCredentialOffer['emailId'] = iterator.emailId;
          sendEmailCredentialOffer['index'] = index;
      
          await this.delay(500); // Wait for 0.5 seconds
          const sendOobOffer = await this.sendEmailForCredentialOffer(sendEmailCredentialOffer);
          
          arraycredentialOfferResponse.push(sendOobOffer);
      }  
      if (0 < errors.length) {
        throw errors;
      }
  
      return arraycredentialOfferResponse.every((result) => true === result);    
    } else {
      credentialOfferResponse = await this.sendEmailForCredentialOffer(sendEmailCredentialOffer);
      return credentialOfferResponse;    
    }
  
  } catch (error) {
    this.logger.error(
      `[outOfBoundCredentialOffer] - error in create out-of-band credentials: ${JSON.stringify(error)}`
    );
    if (0 < error?.length) {
      const errorStack = error?.map((item) => {
        const { message, statusCode, error } = item?.error || item?.response || {};
        return {
          message,
          statusCode,
          error
        };
      });
      throw new RpcException({
        error: errorStack,
        statusCode: error?.status?.code,
        message: ResponseMessages.issuance.error.unableToCreateOOBOffer
      });
    } else {
      throw new RpcException(error.response ? error.response : error);
    }
  }
}

async sendEmailForCredentialOffer(sendEmailCredentialOffer: SendEmailCredentialOffer): Promise<boolean> {
  const {
    iterator,
    emailId,
    index,
    credentialType,
    protocolVersion,
    attributes,
    credentialDefinitionId,
    outOfBandCredential,
    comment,
    organisation,
    errors,
    url,
    orgId,
    organizationDetails
  } = sendEmailCredentialOffer;

  const iterationNo = index + 1;
  try {
    let outOfBandIssuancePayload;
    if (IssueCredentialType.INDY === credentialType) {
    
      outOfBandIssuancePayload = {
        protocolVersion: protocolVersion || 'v1',
        credentialFormats: {
          indy: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            attributes: attributes ? attributes : iterator.attributes.map(({ isRequired, ...rest }) => rest),
            credentialDefinitionId
          }
        },
        autoAcceptCredential: outOfBandCredential.autoAcceptCredential || 'always',
        comment,
        goalCode: outOfBandCredential.goalCode || undefined,
        parentThreadId: outOfBandCredential.parentThreadId || undefined,
        willConfirm: outOfBandCredential.willConfirm || undefined,
        label: organisation?.name,
        imageUrl: organisation?.logoUrl || outOfBandCredential?.imageUrl
      };
    }

    if (IssueCredentialType.JSONLD === credentialType) {
      outOfBandIssuancePayload = {
        protocolVersion: 'v2',
        credentialFormats: {
          jsonld: {
            credential: iterator.credential,
            options: iterator.options
          }
        },
        autoAcceptCredential: outOfBandCredential.autoAcceptCredential || 'always',
        comment,
        goalCode: outOfBandCredential.goalCode || undefined,
        parentThreadId: outOfBandCredential.parentThreadId || undefined,
        willConfirm: outOfBandCredential.willConfirm || undefined,
        label: organisation?.name,
        imageUrl: organisation?.logoUrl || outOfBandCredential?.imageUrl
      };
    }

    const credentialCreateOfferDetails = await this._outOfBandCredentialOffer(outOfBandIssuancePayload, url, orgId);

    if (!credentialCreateOfferDetails) {
      errors.push(new NotFoundException(ResponseMessages.issuance.error.credentialOfferNotFound));
      return false;
    }

    const invitationUrl: string = credentialCreateOfferDetails.response?.invitationUrl;
    const shortenUrl: string = await this.storeIssuanceObjectReturnUrl(invitationUrl);

    if (!invitationUrl) {
      errors.push(new NotFoundException(ResponseMessages.issuance.error.invitationNotFound));
      return false;
    }
        const qrCodeOptions = { type: 'image/png' };
        const outOfBandIssuanceQrCode = await QRCode.toDataURL(shortenUrl, qrCodeOptions);
        const platformConfigData = await this.issuanceRepository.getPlatformConfigDetails();
        if (!platformConfigData) {
          errors.push(new NotFoundException(ResponseMessages.issuance.error.platformConfigNotFound));
          return false;
        }
        this.emailData.emailFrom = platformConfigData.emailFrom;
        this.emailData.emailTo = emailId;
        this.emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Issuance of Your Credential`;
        this.emailData.emailHtml = this.outOfBandIssuance.outOfBandIssuance(emailId, organizationDetails.name, shortenUrl);
        this.emailData.emailAttachments = [
          {
            filename: 'qrcode.png',
            content: outOfBandIssuanceQrCode.split(';base64,')[1],
            contentType: 'image/png',
            disposition: 'attachment'
          }
        ];
        const isEmailSent = await sendEmail(this.emailData);
        this.logger.log(`isEmailSent ::: ${JSON.stringify(isEmailSent)}`);
        if (!isEmailSent) {
          errors.push(new InternalServerErrorException(ResponseMessages.issuance.error.emailSend));
          return false;
        }

        return isEmailSent;

  } catch (error) {
    this.logger.error('[OUT-OF-BAND CREATE OFFER - SEND EMAIL]::', JSON.stringify(error));
    const errorStack = error?.status?.message;
    if (errorStack) {
      errors.push(
        new RpcException({
          error: `${errorStack?.error?.message} at position ${iterationNo}`,
          statusCode: errorStack?.statusCode,
          message: `${ResponseMessages.issuance.error.walletError} at position ${iterationNo}`
        })
      );
    } else {
      errors.push(new InternalServerErrorException(`${error.message} at position ${iterationNo}`));
    }
    return false;
  }
}

  async _outOfBandCredentialOffer(outOfBandIssuancePayload: object, url: string, orgId: string): Promise<{
    response;
  }> {
    try {
      const pattern = { cmd: 'agent-out-of-band-credential-offer' };
      const payload = { outOfBandIssuancePayload, url, orgId };
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_outOfBandCredentialOffer] [NATS call]- error in out of band  : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Description: Fetch agent url
   * @param referenceId
   * @returns agent URL
   */
  async getAgentUrl(
    issuanceMethodLabel: string,
    orgAgentType: string,
    agentEndPoint: string,
    tenantId: string,
    credentialRecordId?: string
  ): Promise<string> {
    try {

      let url;
      switch (issuanceMethodLabel) {
        case 'create-offer': {
          url = orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_ISSUE_CREATE_CRED_OFFER_AFJ}`
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_OFFER}`.replace('#', tenantId)
              : null;
          break;
        }

        case 'create-offer-oob': {
          url = orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_OUT_OF_BAND_CREDENTIAL_OFFER}`
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_CREATE_OFFER_OUT_OF_BAND}`.replace('#', tenantId)
              : null;
          break;
        }

        case 'get-issue-credentials': {
          url = orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_ISSUE_GET_CREDS_AFJ}`
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CREDENTIALS}`.replace('#', tenantId)
              : null;
          break;
        }

        case 'get-issue-credential-by-credential-id': {
          
          url = orgAgentType === OrgAgentType.DEDICATED
              ? `${agentEndPoint}${CommonConstants.URL_ISSUE_GET_CREDS_AFJ_BY_CRED_REC_ID}/${credentialRecordId}`
              : orgAgentType === OrgAgentType.SHARED
              ? `${agentEndPoint}${CommonConstants.URL_SHAGENT_GET_CREDENTIALS_BY_CREDENTIAL_ID}`.replace('#', credentialRecordId).replace('@', tenantId)
              : null;
          break;
        }

        default: {
          break;
        }
      }

      if (!url) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentUrlNotFound);
      }

      return url;
    } catch (error) {
      this.logger.error(`Error in get agent url: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async exportSchemaToCSV(credentialDefinitionId: string): Promise<object> {
    try {
      const schemaResponse: SchemaDetails = await this.issuanceRepository.getCredentialDefinitionDetails(credentialDefinitionId);

      const jsonData = [];
      const attributesArray = JSON.parse(schemaResponse.attributes);

      // Extract the 'attributeName' values from the objects and store them in an array
      const attributeNameArray = attributesArray.map(attribute => attribute.attributeName);
      attributeNameArray.unshift('email');

      const [csvData, csvFields] = [jsonData, attributeNameArray];

      if (!csvData || !csvFields) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject('Unable to transform schema data for CSV.');
      }

      const csv = parse(csvFields, { fields: csvFields });

      const filePath = join(process.cwd(), `uploadedFiles/exports`);

      const timestamp = Math.floor(Date.now() / 1000);
      const fileName = `${schemaResponse.tag}-${timestamp}.csv`;

      await createFile(filePath, fileName, csv);
      const fullFilePath = join(process.cwd(), `uploadedFiles/exports/${fileName}`);

      if (!checkIfFileOrDirectoryExists(fullFilePath)) {
        throw new NotFoundException(ResponseMessages.bulkIssuance.error.PathNotFound);
      }

      // https required to download csv from frontend side
      const filePathToDownload = `${process.env.API_GATEWAY_PROTOCOL_SECURE}://${process.env.UPLOAD_LOGO_HOST}/${fileName}`;
      return {
        fileContent: filePathToDownload,
        fileName
      };
    } catch (error) {
      throw new Error('An error occurred during CSV export.');
    }
  }


  async importAndPreviewDataForIssuance(importFileDetails: ImportFileDetails, requestId?: string): Promise<string> {
    try {
      
      const credDefResponse =
        await this.issuanceRepository.getCredentialDefinitionDetails(importFileDetails.credDefId);

      const getFileDetails = await this.awsService.getFile(importFileDetails.fileKey);
      const csvData: string = getFileDetails.Body.toString();

      const parsedData = paParse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformheader: (header) => header.toLowerCase().replace('#', '').trim(),
        complete: (results) => results.data
      });

      if (0 >= parsedData.data.length) {
        throw new BadRequestException(`File data is empty`);
      }

      if (0 >= parsedData.meta.fields.length) {
        throw new BadRequestException(`File header is empty`);
      }

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const validateEmail = (email) => {
        // Regular expression for a simple email validation
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailRegex.test(email);
      };

      // Extract and validate emails
      const invalidEmails = parsedData.data.filter((entry) => !validateEmail(entry.email));

      // Output invalid emails
      if (0 < invalidEmails.length) {
        throw new BadRequestException(`Invalid emails found in the chosen file`);
      }

      const fileData: string[][] = parsedData.data.map(Object.values);
      const fileHeader: string[] = parsedData.meta.fields;

      const attributesArray = JSON.parse(credDefResponse.attributes);

      // Extract the 'attributeName' values from the objects and store them in an array
      const attributeNameArray = attributesArray.map(attribute => attribute.attributeName);

      if (0 >= attributeNameArray.length) {
        throw new BadRequestException(
          `Attributes are empty for credential definition ${importFileDetails.credDefId}`
        );
      }

      await this.validateFileHeaders(fileHeader, attributeNameArray);
      await this.validateFileData(fileData, attributesArray, fileHeader);

      const resData = {
        schemaLedgerId: credDefResponse.schemaLedgerId,
        credentialDefinitionId: importFileDetails.credDefId,
        fileData: parsedData,
        fileName: importFileDetails.fileName
      };
      
      const newCacheKey = uuidv4();

      await this.cacheManager.set(requestId ? requestId : newCacheKey, JSON.stringify(resData), 60000);

      return newCacheKey;

    } catch (error) {
      this.logger.error(`error in validating credentials : ${error.response}`);
      throw  new Error(error.response.message ? error.response.message : error);
    } finally {
      // await this.awsService.deleteFile(importFileDetails.fileKey);
      // this.logger.error(`Deleted uploaded file after processing.`);
    }
  }

  async previewFileDataForIssuance(
    requestId: string,
    previewRequest: PreviewRequest
  ): Promise<object> {
    try {
      if ('' !== requestId.trim()) {
        const cachedData = await this.cacheManager.get(requestId);
        if (!cachedData) {
          throw new NotFoundException(ResponseMessages.issuance.error.emptyFileData);
        }
        if (cachedData === undefined || null) {
          throw new BadRequestException(ResponseMessages.issuance.error.previewCachedData);
        }
        const parsedData = JSON.parse(cachedData as string).fileData.data;
        parsedData.sort(orderValues(previewRequest.sortBy, previewRequest.sortField));
        const finalData = paginator(parsedData, previewRequest.pageNumber, previewRequest.pageSize);

        return finalData;
      } else {
        throw new BadRequestException(ResponseMessages.issuance.error.previewFile);
      }
    } catch (error) {
      this.logger.error(`error in previewFileDataForIssuance : ${error}`);
      throw new RpcException(error.response);
    }
  }

  async getFileDetailsByFileId(
    fileId: string,
    getAllfileDetails: PreviewRequest
  ): Promise<object> {
    try {

      const fileData = await this.issuanceRepository.getFileDetailsByFileId(fileId, getAllfileDetails);

      const fileResponse = {
        totalItems: fileData.fileCount,
        hasNextPage: getAllfileDetails.pageSize * getAllfileDetails.pageNumber < fileData.fileCount,
        hasPreviousPage: 1 < getAllfileDetails.pageNumber,
        nextPage: Number(getAllfileDetails.pageNumber) + 1,
        previousPage: getAllfileDetails.pageNumber - 1,
        lastPage: Math.ceil(fileData.fileCount / getAllfileDetails.pageSize),
        data: fileData.fileDataList
      };

      if (0 !== fileData.fileCount) {
        return fileResponse;
      } else {
        throw new NotFoundException(ResponseMessages.issuance.error.fileNotFound);
      }

    } catch (error) {
      this.logger.error(`error in issuedFileDetails : ${error}`);
      throw new RpcException(error.response);
    }
  }

  async issuedFileDetails(
    orgId: string,
    getAllfileDetails: PreviewRequest
  ): Promise<object> {
    try {

      const fileDetails = await this.issuanceRepository.getAllFileDetails(orgId, getAllfileDetails);
      const fileResponse = {
        totalItems: fileDetails.fileCount,
        hasNextPage: getAllfileDetails.pageSize * getAllfileDetails.pageNumber < fileDetails.fileCount,
        hasPreviousPage: 1 < getAllfileDetails.pageNumber,
        nextPage: Number(getAllfileDetails.pageNumber) + 1,
        previousPage: getAllfileDetails.pageNumber - 1,
        lastPage: Math.ceil(fileDetails.fileCount / getAllfileDetails.pageSize),
        data: fileDetails.fileList
      };

      if (0 !== fileDetails.fileCount) {
        return fileResponse;
      } else {
        throw new NotFoundException(ResponseMessages.issuance.error.notFound);
      }

    } catch (error) {
      this.logger.error(`error in issuedFileDetails : ${error}`);
      throw new RpcException(error.response);
    }
  }

  async delay(ms): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async issueBulkCredential(requestId: string, orgId: string, clientDetails: IClientDetails, reqPayload: ImportFileDetails): Promise<string> {
    const fileUpload: {
      lastChangedDateTime: Date;
      name?: string;
      upload_type: string;
      status: string;
      orgId: string | number;
      createDateTime: Date;
    } = {
      upload_type: '',
      status: '',
      orgId: '',
      createDateTime: undefined,
      lastChangedDateTime: undefined
    };
    let respFileUpload;
    if ('' === requestId.trim()) {
      throw new BadRequestException(
        `Param 'requestId' is missing from the request.`
      );
    }

    try {
      let cachedData = await this.cacheManager.get(requestId);
      if (!cachedData) {
        throw new BadRequestException(ResponseMessages.issuance.error.cacheTimeOut);
      }

      if (cachedData && clientDetails?.isSelectiveIssuance) {
        await this.cacheManager.del(requestId);
        await this.importAndPreviewDataForIssuance(reqPayload, requestId);
        //  await this.cacheManager.set(requestId, reqPayload);
        cachedData = await this.cacheManager.get(requestId);
      }
      const parsedData = JSON.parse(cachedData as string).fileData.data;
      const parsedPrimeDetails = JSON.parse(cachedData as string);

      fileUpload.upload_type = FileUploadType.Issuance;
      fileUpload.status = FileUploadStatus.started;
      fileUpload.orgId = orgId;
      fileUpload.createDateTime = new Date();

      if (parsedPrimeDetails && parsedPrimeDetails.fileName) {
        fileUpload.name = parsedPrimeDetails.fileName;
      }

      respFileUpload = await this.issuanceRepository.saveFileUploadDetails(fileUpload, clientDetails.userId);

      const saveFileDetailsPromises = parsedData.map(async (element) => {
        const credentialPayload = {
          credential_data: element,
          schemaId: parsedPrimeDetails.schemaLedgerId,
          credDefId: parsedPrimeDetails.credentialDefinitionId,
          state: false,
          isError: false,
          fileUploadId: respFileUpload.id
        };
        return this.issuanceRepository.saveFileDetails(credentialPayload, clientDetails.userId);
      });

      // Wait for all saveFileDetails operations to complete
      await Promise.all(saveFileDetailsPromises);

      // Now fetch the file details
      const respFile = await this.issuanceRepository.getFileDetails(respFileUpload.id);
      if (!respFile) {
        throw new BadRequestException(ResponseMessages.issuance.error.fileData);
      }
      for (const element of respFile) {
        try {
          const payload = {
            data: element.credential_data,
            fileUploadId: element.fileUploadId,
            clientId: clientDetails.clientId,
            cacheId: requestId,
            credentialDefinitionId: element.credDefId,
            schemaLedgerId: element.schemaId,
            isRetry: false,
            orgId,
            id: element.id,
            isLastData: respFile.indexOf(element) === respFile.length - 1
          };

          await this.delay(500); // Wait for 0.5 secends
          this.processIssuanceData(payload);
        } catch (error) {
          this.logger.error(`Error processing issuance data: ${error}`);
        }
      }

      return 'Process initiated for bulk issuance';
    } catch (error) {
      fileUpload.status = FileUploadStatus.interrupted;
      this.logger.error(`error in issueBulkCredential : ${error}`);
      throw new RpcException(error.response);
    } finally {
      if (respFileUpload !== undefined && respFileUpload.id !== undefined) {
        fileUpload.lastChangedDateTime = new Date();
        await this.issuanceRepository.updateFileUploadDetails(respFileUpload.id, fileUpload);
      }
    }
  }

  async retryBulkCredential(fileId: string, orgId: string, clientId: string): Promise<string> {
    let respFile;

    try {

      const fileDetails = await this.issuanceRepository.getFileDetailsById(fileId);
      if (!fileDetails) {
        throw new BadRequestException(ResponseMessages.issuance.error.retry);
      }
      respFile = await this.issuanceRepository.getFailedCredentials(fileId);

      if (0 === respFile.length) {
        const errorMessage = ResponseMessages.bulkIssuance.error.fileDetailsNotFound;
        throw new BadRequestException(`${errorMessage}`);
      }

      for (const element of respFile) {
        try {
          const payload = {
            data: element.credential_data,
            fileUploadId: element.fileUploadId,
            clientId,
            credentialDefinitionId: element.credDefId,
            schemaLedgerId: element.schemaId,
            orgId,
            id: element.id,
            isRetry: true,
            isLastData: respFile.indexOf(element) === respFile.length - 1
          };

          await this.delay(500); // Wait for 0.5 secends
          this.processIssuanceData(payload);
          if (0 === respFile.length) {
            return FileUploadStatus.completed;
          }
        } catch (error) {
          // Handle errors if needed
          this.logger.error(`Error processing issuance data: ${error}`);
        }
      }

      return 'Process reinitiated for bulk issuance';
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
  async processIssuanceData(jobDetails) {

    const socket = await io(`${process.env.SOCKET_HOST}`, {
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: Infinity,
      autoConnect: true,
      transports: ['websocket']
    });

    const fileUploadData: FileUploadData = {
      fileUpload: '',
      fileRow: '',
      isError: false,
      referenceId: '',
      createDateTime: undefined,
      error: '',
      detailError: '',
      jobId: ''
    };

    fileUploadData.fileUpload = jobDetails.fileUploadId;
    fileUploadData.fileRow = JSON.stringify(jobDetails);
    fileUploadData.isError = false;
    fileUploadData.createDateTime = new Date();
    fileUploadData.referenceId = jobDetails.data.email;
    fileUploadData.jobId = jobDetails.id;
    const {orgId} = jobDetails;

    const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
    // eslint-disable-next-line camelcase

    const { organisation } = agentDetails;
    let isErrorOccurred = false;
    try {

      const oobIssuancepayload = {
        credentialDefinitionId: jobDetails.credentialDefinitionId,
        orgId: jobDetails.orgId,
        label: organisation?.name,
        attributes: [],
        emailId: jobDetails.data.email,
        credentialType: IssueCredentialType.INDY
      };

      for (const key in jobDetails.data) {
        if (jobDetails.data.hasOwnProperty(key) && 'email' !== key) {
          const value = jobDetails.data[key];
          oobIssuancepayload.attributes.push({ name: key, value });
        }
      }

      const oobCredentials = await this.outOfBandCredentialOffer(
        oobIssuancepayload
      );

      if (oobCredentials) {
        await this.issuanceRepository.deleteFileDataByJobId(jobDetails.id);
      }
    } catch (error) {
      this.logger.error(
        `error in issuanceBulkCredential for data : ${JSON.stringify(error)}`
      );
      fileUploadData.isError = true;
      fileUploadData.error = JSON.stringify(error.error) ? JSON.stringify(error.error) : JSON.stringify(error);
      fileUploadData.detailError = `${JSON.stringify(error)}`;
      if (!isErrorOccurred) {
        isErrorOccurred = true;
        socket.emit('error-in-bulk-issuance-process', { clientId: jobDetails.clientId, fileUploadId: jobDetails.fileUploadId, error });
      }

    }
    await this.issuanceRepository.updateFileUploadData(fileUploadData);

    try {
      if (jobDetails.isLastData) {
        const errorCount = await this.issuanceRepository.countErrorsForFile(jobDetails.fileUploadId);
        const status =
          0 === errorCount ? FileUploadStatus.completed : FileUploadStatus.partially_completed;

        if (!jobDetails.isRetry) {
          socket.emit('bulk-issuance-process-completed', { clientId: jobDetails.clientId, fileUploadId: jobDetails.fileUploadId });
          this.cacheManager.del(jobDetails.cacheId);
        } else {
          socket.emit('bulk-issuance-process-retry-completed', { clientId: jobDetails.clientId });
        }

        await this.issuanceRepository.updateFileUploadDetails(jobDetails.fileUploadId, {
          status,
          lastChangedDateTime: new Date()
        });
      }
    } catch (error) {
      this.logger.error(`Error in completing bulk issuance process: ${error}`);
      if (!isErrorOccurred) {
        isErrorOccurred = true;
        socket.emit('error-in-bulk-issuance-retry-process', { clientId: jobDetails.clientId, error });
      }
      throw error;

    }

  }

  async validateFileHeaders(
    fileHeader: string[],
    schemaAttributes: string[]
  ): Promise<void> {
    try {
      const fileSchemaHeader: string[] = fileHeader.slice();
            if ('email' === fileHeader[0]) {
                fileSchemaHeader.splice(0, 1);
      } else {
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.emailColumn
        );
      }

      if (schemaAttributes.length !== fileSchemaHeader.length) {
        throw new ConflictException(ResponseMessages.bulkIssuance.error.attributeNumber
        );
      }

      const mismatchedAttributes = fileSchemaHeader.filter(value => !schemaAttributes.includes(value));

      if (0 < mismatchedAttributes.length) {
        throw new ConflictException(ResponseMessages.bulkIssuance.error.mismatchedAttributes);
      }
    } catch (error) {
      throw error;

    }
  }

  async validateFileData(fileData: string[][], attributesArray: { attributeName: string, schemaDataType: string,  displayName: string, isRequired: boolean }[], fileHeader: string[]): Promise<void> {
    try { 
      const filedata = fileData.map((item: string[]) => {
       const fileHeaderData = item?.map((element, j) => ({
           value: element,
           header: fileHeader[j]
         }));
       return fileHeaderData;
      });
       
       const errorFileData = [];
   
       filedata.forEach((attr, i) => {
        attr.forEach((eachElement) => {

         attributesArray.forEach((eachItem) => {
           if (eachItem.attributeName === eachElement.header) {
               if (eachItem.isRequired && !eachElement.value) {
                 errorFileData.push(`Attribute ${eachItem.attributeName} is required at row ${i + 1}`);
               }
           }
           });
           return eachElement;
         });
         return attr;
       });
   
       if (0 < errorFileData.length) {
         throw new BadRequestException(errorFileData);
       }
    } catch (error) {
      throw error;
    }
  }

  async _getOrgAgentApiKey(orgId: string): Promise<string> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.issuanceServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
          status: error.status,
          error: error.message
        }, error.status);
    }
  }

}
