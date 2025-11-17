/* eslint-disable quotes */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { IssuanceRepository } from './issuance.repository';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import { BulkPayloadDetails, CredentialOffer, FileUpload, FileUploadData, IAttributes, IBulkPayloadObject, IClientDetails, ICreateOfferResponse, ICredentialPayload, IIssuance, IIssueData, IPattern, IQueuePayload, ISchemaAttributes, ISendOfferNatsPayload, ImportFileDetails, IssueCredentialWebhookPayload, OutOfBandCredentialOfferPayload, PreviewRequest, SchemaDetails, SendEmailCredentialOffer, TemplateDetailsInterface } from '../interfaces/issuance.interfaces';
import { AutoAccept, IssuanceProcessState, OrgAgentType, PromiseResult, SchemaType, TemplateIdentifier, W3CSchemaDataType} from '@credebl/enum/enum';
import * as QRCode from 'qrcode';
import { OutOfBandIssuance } from '../templates/out-of-band-issuance.template';
import { EmailDto } from '@credebl/common/dtos/email.dto';
import { join } from 'path';
import { parse } from 'json2csv';
import { checkIfFileOrDirectoryExists, createFile } from '../../api-gateway/src/helper-files/file-operation.helper';
import { parse as paParse } from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { convertUrlToDeepLinkUrl, paginator } from '@credebl/common/common.utils';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FileUploadStatus, FileUploadType } from 'apps/api-gateway/src/enum';
import { AwsService } from '@credebl/aws';
import { io } from 'socket.io-client';
import { IIssuedCredentialSearchParams, IssueCredentialType } from 'apps/api-gateway/src/issuance/interfaces';
import { ICredentialOfferResponse, IDeletedIssuanceRecords, IIssuedCredential, IJsonldCredential, IPrettyVc, ISchemaObject } from '@credebl/common/interfaces/issuance.interface';
import { OOBIssueCredentialDto } from 'apps/api-gateway/src/issuance/dtos/issuance.dto';
import { RecordType, agent_invitations, org_agents, organisation, user } from '@prisma/client';
import { createOobJsonldIssuancePayload, validateAndUpdateIssuanceDates, validateEmail } from '@credebl/common/cast.helper';
import { sendEmail } from '@credebl/common/send-grid-helper-file';
import * as pLimit from 'p-limit';
import { UserActivityRepository } from 'libs/user-activity/repositories';
import { validateW3CSchemaAttributes } from '../libs/helpers/attributes.validator';
import { ISchemaDetail } from '@credebl/common/interfaces/schema.interface';

@Injectable()
export class IssuanceService {
  private readonly logger = new Logger('IssueCredentialService');
  private counter = 0;
  private processedJobsCounters: Record<string, number> = {};
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceServiceProxy: ClientProxy,
    private readonly commonService: CommonService,
    private readonly issuanceRepository: IssuanceRepository,
    private readonly userActivityRepository: UserActivityRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly outOfBandIssuance: OutOfBandIssuance,
    private readonly emailData: EmailDto,
    private readonly awsService: AwsService,
    @InjectQueue('bulk-issuance') private bulkIssuanceQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) { }

  async getIssuanceRecords(orgId: string): Promise<number> {
    try {
      return await this.issuanceRepository.getIssuanceRecordsCount(orgId);
    } catch (error) {
                    
      this.logger.error(
        `[getIssuanceRecords ] [NATS call]- error in get issuance records count : ${JSON.stringify(error)}`
      );
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getW3CSchemaAttributes(schemaUrl: string): Promise<ISchemaAttributes[]> {
    const schemaRequest = await this.commonService.httpGet(schemaUrl).then(async (response) => response);
    if (!schemaRequest) {
      throw new NotFoundException(ResponseMessages.schema.error.W3CSchemaNotFOund, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.notFound
      });
    } 

      const getSchemaDetails = await this.issuanceRepository.getSchemaDetails(schemaUrl);
      const schemaAttributes = JSON.parse(getSchemaDetails?.attributes);

      return schemaAttributes;
  }

  async sendCredentialCreateOffer(payload: IIssuance): Promise<ICredentialOfferResponse> {
    try {
      const { orgId, credentialDefinitionId, comment, credentialData } = payload || {};

      if (payload.credentialType === IssueCredentialType.INDY) {
        const schemaResponse: SchemaDetails = await this.issuanceRepository.getCredentialDefinitionDetails(
          credentialDefinitionId
        );
        if (schemaResponse?.attributes) {
          const schemaResponseError = [];
          const attributesArray: IAttributes[] = JSON.parse(schemaResponse.attributes);

          attributesArray.forEach((attribute) => {
            if (attribute.attributeName && attribute.isRequired) {
              credentialData.forEach((credential, i) => {
                credential.attributes.forEach((attr) => {
                  if (attr.name === attribute.attributeName && attribute.isRequired && !attr.value) {
                    schemaResponseError.push(`Attribute ${attribute.attributeName} is required at position ${i + 1}`);
                  }
                });
              });
            }
          });

          if (0 < schemaResponseError.length) {
            throw new BadRequestException(schemaResponseError);
          }
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


      if (payload.credentialType === IssueCredentialType.JSONLD) {
        await validateAndUpdateIssuanceDates(credentialData);
      }
      
      const issuancePromises = credentialData.map(async (credentials) => {
        const { connectionId, attributes, credential, options } = credentials;
        let issueData;

        if (payload.credentialType === IssueCredentialType.INDY) {
          issueData = {
            protocolVersion: payload.protocolVersion || 'v1',
            connectionId,
            credentialFormats: {
              indy: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                attributes: attributes.map(({ isRequired, ...rest }) => rest),
                credentialDefinitionId
              }
            },
            autoAcceptCredential: payload.autoAcceptCredential || 'always',
            comment
          };
        } else if (payload.credentialType === IssueCredentialType.JSONLD) {
          issueData = {
            protocolVersion: payload.protocolVersion || 'v2',
            connectionId,
            credentialFormats: {
              jsonld: {
                credential,
                options
              }
            },
            autoAcceptCredential: payload.autoAcceptCredential || 'always',
            comment: comment || ''
          };
          const payloadAttributes = issueData?.credentialFormats?.jsonld?.credential?.credentialSubject;

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...filteredIssuanceAttributes } = payloadAttributes;

          const schemaServerUrl = issueData?.credentialFormats?.jsonld?.credential?.['@context']?.[1];

          const schemaUrlAttributes = await this.getW3CSchemaAttributes(schemaServerUrl);
          validateW3CSchemaAttributes(filteredIssuanceAttributes, schemaUrlAttributes);
        }

        await this.delay(500);
        return this._sendCredentialCreateOffer(issueData, url, orgId);
      });

      const results = await Promise.allSettled(issuancePromises);

      const processedResults = results.map((result) => {
        if (PromiseResult.REJECTED === result.status) {
          return {
            statusCode: result?.reason?.status?.message?.statusCode || result?.reason?.response?.statusCode,
            message: result?.reason?.status?.message?.error?.message || result?.reason?.response?.message,
            error: result?.reason?.response?.error || ResponseMessages.errorMessages.serverError
          };
        } else if (PromiseResult.FULFILLED === result.status) {
          return {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.issuance.success.create,
            data: result.value
          };
        }
        return null;
      });

      const allSuccessful = processedResults.every((result) => result?.statusCode === HttpStatus.CREATED);
      const allFailed = processedResults.every((result) => result?.statusCode !== HttpStatus.CREATED);

      let finalStatusCode: HttpStatus;
      let finalMessage: string;

      if (allSuccessful) {
        finalStatusCode = HttpStatus.CREATED;
        finalMessage = ResponseMessages.issuance.success.create;
      } else if (allFailed) {
        finalStatusCode = HttpStatus.BAD_REQUEST;
        finalMessage = ResponseMessages.issuance.error.unableToCreateOffer;
      } else {
        finalStatusCode = HttpStatus.PARTIAL_CONTENT;
        finalMessage = ResponseMessages.issuance.success.partiallyOfferCreated;
      }

      const finalResult = {
        statusCode: finalStatusCode,
        message: finalMessage,
        data: processedResults
      };

      return finalResult;
      
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
      let invitationDid: string | undefined;
      if (true === reuseConnection) {
        const invitation: agent_invitations = await this.issuanceRepository.getInvitationDidByOrgId(orgId);
        invitationDid = invitation?.invitationDid ?? undefined;
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
          invitationDid:invitationDid || undefined
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
          invitationDid:invitationDid || undefined
        };
        const payloadAttributes = issueData?.credentialFormats?.jsonld?.credential?.credentialSubject;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...filteredIssuanceAttributes } = payloadAttributes;

        const schemaServerUrl = issueData?.credentialFormats?.jsonld?.credential?.['@context']?.[1];

        const schemaUrlAttributes = await this.getW3CSchemaAttributes(schemaServerUrl);
        validateW3CSchemaAttributes(filteredIssuanceAttributes, schemaUrlAttributes);
        
      }
      const credentialCreateOfferDetails = await this._outOfBandCredentialOffer(issueData, url, orgId);
      if (isShortenUrl) {
        const invitationUrl: string = credentialCreateOfferDetails.response?.invitationUrl;
        const url: string = await this.storeIssuanceObjectReturnUrl(invitationUrl);
        credentialCreateOfferDetails.response['invitationUrl'] = url;
        // Add deepLinkURL param to response
        const deepLinkURL = convertUrlToDeepLinkUrl(url);
        credentialCreateOfferDetails.response['deepLinkURL'] = deepLinkURL;
      }
      return credentialCreateOfferDetails.response;
    } catch (error) {
      this.logger.error(`[storeIssuanceObjectReturnUrl] - error in create credentials : ${JSON.stringify(error)}`);

      const errorStack = error?.status?.message?.error;
      if (errorStack) {
        throw new RpcException({
          message: errorStack?.reason ? errorStack?.reason : errorStack?.message,
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

      const getSchemaIds = getIssuedCredentialsList?.issuedCredentialsList?.map((schema) => schema?.schemaId);

      const getSchemaDetails = await this._getSchemaDetails(getSchemaIds);

      let responseWithSchemaName;
      if (getSchemaDetails) {
        responseWithSchemaName = getIssuedCredentialsList?.issuedCredentialsList.map(file => {
          const schemaDetail = getSchemaDetails?.find(schema => schema.schemaLedgerId === file.schemaId);
          return {
            ...file,
            schemaName: schemaDetail?.name
          };
        });
      } else {     
        const getSchemaUrlDetails = await this.getSchemaUrlDetails(getSchemaIds);
        responseWithSchemaName = getIssuedCredentialsList?.issuedCredentialsList.map(file => {
          const schemaDetail = getSchemaUrlDetails?.find(schema => schema.title);
          return {
            ...file,
            schemaName: schemaDetail?.title
          };
        });
      }
      const issuedCredentialsResponse: IIssuedCredential = {
        totalItems: getIssuedCredentialsList.issuedCredentialsCount,
        hasNextPage:
          issuedCredentialsSearchCriteria.pageSize * issuedCredentialsSearchCriteria.pageNumber < getIssuedCredentialsList.issuedCredentialsCount,
        hasPreviousPage: 1 < issuedCredentialsSearchCriteria.pageNumber,
        nextPage: Number(issuedCredentialsSearchCriteria.pageNumber) + 1,
        previousPage: issuedCredentialsSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(getIssuedCredentialsList.issuedCredentialsCount / issuedCredentialsSearchCriteria.pageSize),
        data: responseWithSchemaName
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

  async getSchemaUrlDetails(schemaUrls: string[]): Promise<ISchemaObject[]> {
    const results = [];
    
    for (const schemaUrl of schemaUrls) {
        const schemaRequest = await this.commonService.httpGet(schemaUrl);
        if (!schemaRequest) {
            throw new NotFoundException(ResponseMessages.schema.error.W3CSchemaNotFOund, {
                cause: new Error(),
                description: ResponseMessages.errorMessages.notFound
            });
        }
        results.push(schemaRequest);
    }
    return results;
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

  async getIssueCredentialWebhook(payload: IssueCredentialWebhookPayload): Promise<org_agents> {
    try {
      const agentDetails: org_agents = await this.issuanceRepository.saveIssuedCredentialDetails(payload);
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

async outOfBandCredentialOffer(outOfBandCredential: OutOfBandCredentialOfferPayload, platformName?: string, organizationLogoUrl?: string, prettyVc?: IPrettyVc): Promise<boolean> {
  try {
    const {
      credentialOffer,
      comment,
      credentialDefinitionId,
      orgId,
      protocolVersion,
      attributes,
      emailId,
      credentialType,
      isReuseConnection
    } = outOfBandCredential;

    if (IssueCredentialType.JSONLD === credentialType) {
      await validateAndUpdateIssuanceDates(credentialOffer);
    }

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
      isReuseConnection?: boolean;
      attributes: IAttributes[];
      credentialDefinitionId: string;
      outOfBandCredential: OutOfBandCredentialOfferPayload;
      comment: string;
      organisation: organisation;
      errors: string[];
      url: string;
      orgId: string;
      organizationDetails: organisation;
      platformName?: string;
      organizationLogoUrl?: string;
      prettyVc?: IPrettyVc;
    } = {
      credentialType,
      protocolVersion,
      isReuseConnection,
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
      index: 0,
      platformName: platformName || null,
      organizationLogoUrl: organizationLogoUrl || null,
      prettyVc: {
        certificate: prettyVc?.certificate,
        size: prettyVc?.size,
        orientation: prettyVc?.orientation
      }
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
        const { statusCode, message, error } = item?.error || item?.response || {};
        return {
          statusCode,
          message,
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
    organizationDetails,
    platformName,
    organizationLogoUrl,
    isReuseConnection
  } = sendEmailCredentialOffer;
  const iterationNo = index + 1;
  try {


    let invitationDid: string | undefined;
    if (true === isReuseConnection) {
      const invitation: agent_invitations = await this.issuanceRepository.getInvitationDidByOrgId(orgId);
      invitationDid = invitation?.invitationDid ?? undefined;
    }

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
        imageUrl: organisation?.logoUrl || outOfBandCredential?.imageUrl,
        invitationDid: invitationDid || undefined
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
        // For Educreds
        autoAcceptCredential: AutoAccept.Always,
        comment,
        goalCode: outOfBandCredential.goalCode || undefined,
        parentThreadId: outOfBandCredential.parentThreadId || undefined,
        willConfirm: outOfBandCredential.willConfirm || undefined,
        label: organisation?.name,
        imageUrl: organisation?.logoUrl || outOfBandCredential?.imageUrl,
        invitationDid: invitationDid || undefined
      };

      const payloadAttributes = outOfBandIssuancePayload?.credentialFormats?.jsonld?.credential?.credentialSubject;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...filteredIssuanceAttributes } = payloadAttributes;

      const schemaServerUrl = outOfBandIssuancePayload?.credentialFormats?.jsonld?.credential?.['@context']?.[1];

      const schemaUrlAttributes = await this.getW3CSchemaAttributes(schemaServerUrl);
      validateW3CSchemaAttributes(filteredIssuanceAttributes, schemaUrlAttributes);

    }
    const credentialCreateOfferDetails = await this._outOfBandCredentialOffer(outOfBandIssuancePayload, url, orgId);

    if (!credentialCreateOfferDetails) {
      errors.push(new NotFoundException(ResponseMessages.issuance.error.credentialOfferNotFound));
      return false;
    }

    const invitationUrl: string = credentialCreateOfferDetails.response?.invitationUrl;

    const shortenUrl: string = await this.storeIssuanceObjectReturnUrl(invitationUrl);

    const deeplLinkURL = convertUrlToDeepLinkUrl(shortenUrl);

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
        this.emailData.emailFrom = platformConfigData?.emailFrom;
        this.emailData.emailTo = iterator?.emailId ?? emailId;
        const platform = platformName || process.env.PLATFORM_NAME;
        this.emailData.emailSubject = `${platform} Platform: Issuance of Your Credential`;
        this.emailData.emailHtml = this.outOfBandIssuance.outOfBandIssuance(emailId, organizationDetails.name, deeplLinkURL, platformName, organizationLogoUrl);
        this.emailData.emailAttachments = [
          {
            filename: 'qrcode.png',
            content: outOfBandIssuanceQrCode.split(';base64,')[1],
            contentType: 'image/png',
            disposition: 'attachment'
          }
        ];


        const isEmailSent = await sendEmail(this.emailData);   
         
        this.logger.log(`isEmailSent ::: ${JSON.stringify(isEmailSent)}-${this.counter}`);
        this.counter++;
        if (!isEmailSent) {
          errors.push(new InternalServerErrorException(ResponseMessages.issuance.error.emailSend));
          return false;
        }

        return isEmailSent;

  } catch (error) {
    const iterationNoMessage = ` at position ${iterationNo}`;
    this.logger.error('[OUT-OF-BAND CREATE OFFER - SEND EMAIL]::', JSON.stringify(error));
    const errorStack = error?.status?.message;
    if (errorStack) {
      errors.push(
        new RpcException({
          statusCode: errorStack?.statusCode,
          message: `${ResponseMessages.issuance.error.walletError} at position ${iterationNo}`,
          error: `${errorStack?.error?.message} at position ${iterationNo}`       
         })
      );

      error.status.message = `${error.status.message}${iterationNoMessage}`;
        throw error;
    }  else {
      errors.push(
        new RpcException({
          statusCode: error?.response?.statusCode,
          message: `${error?.response?.message} at position ${iterationNo}`,
          error: error?.response?.error
        })
      );
      error.response.message = `${error.response.message}${iterationNoMessage}`;
      throw error;  // Check With other issuance flow
    }
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

  async downloadBulkIssuanceCSVTemplate(templateDetails: TemplateDetailsInterface): Promise<object> {
    try {
      let schemaResponse: SchemaDetails;
      let fileName: string;

      const {schemaType, templateId} = templateDetails;

      if (!templateId) {
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.invalidtemplateId);
      }
      const timestamp = Math.floor(Date.now() / 1000);
      
      if (schemaType === SchemaType.INDY) {
         schemaResponse = await this.issuanceRepository.getCredentialDefinitionDetails(templateId);
         if (!schemaResponse) {
          throw new NotFoundException(ResponseMessages.bulkIssuance.error.invalidIdentifier);
        }
         fileName = `${schemaResponse.tag}-${timestamp}.csv`;

      } else if (schemaType === SchemaType.W3C_Schema) {
        const schemDetails = await this.issuanceRepository.getSchemaDetailsBySchemaIdentifier(templateId);
        const {attributes, schemaLedgerId, name} = schemDetails;
        schemaResponse = { attributes, schemaLedgerId, name };
        if (!schemaResponse) {
          throw new NotFoundException(ResponseMessages.bulkIssuance.error.invalidIdentifier);
        }
         fileName = `${schemaResponse.name}-${timestamp}.csv`;
      }   
      const jsonData = [];
      const attributesArray = JSON.parse(schemaResponse.attributes);
      
      // Extract the 'attributeName' values from the objects and store them in an array
      const attributeNameArray = attributesArray.map(attribute => attribute.attributeName);
      attributeNameArray.unshift(TemplateIdentifier.EMAIL_COLUMN);

      const [csvData, csvFields] = [jsonData, attributeNameArray];

      if (!csvData || !csvFields) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject('Unable to transform schema data for CSV.');
      }

      const csv = parse(csvFields, { fields: csvFields });

      const filePath = join(process.cwd(), `uploadedFiles/exports`);


      await createFile(filePath, fileName, csv);
      const fullFilePath = join(process.cwd(), `uploadedFiles/exports/${fileName}`);
      this.logger.log('fullFilePath::::::::', fullFilePath); //remove after user
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
      throw new Error(ResponseMessages.bulkIssuance.error.exportFile);
    }
  }


  async uploadCSVTemplate(importFileDetails: ImportFileDetails, requestId?: string): Promise<string> {
    try {
      let credentialDetails;
      const credentialPayload: ICredentialPayload = {
        schemaLedgerId: '',
        credentialDefinitionId: '',
        fileData: {},
        fileName: '',
        credentialType: '',
        schemaName: ''
      };
      const { fileName, templateId, type } = importFileDetails;
      if (type === SchemaType.W3C_Schema) {
        credentialDetails = await this.issuanceRepository.getSchemaDetailsBySchemaIdentifier(templateId);
        credentialPayload.schemaLedgerId = credentialDetails.schemaLedgerId;
        credentialPayload.credentialDefinitionId = SchemaType.W3C_Schema;
        credentialPayload.credentialType = SchemaType.W3C_Schema;
        credentialPayload.schemaName = credentialDetails.name;
      } else if (type === SchemaType.INDY) {
        credentialDetails = await this.issuanceRepository.getCredentialDefinitionDetails(templateId);
        credentialPayload.schemaLedgerId = credentialDetails.schemaLedgerId;
        credentialPayload.credentialDefinitionId = credentialDetails.credentialDefinitionId;
        credentialPayload.credentialType = SchemaType.INDY;
        credentialPayload.schemaName = credentialDetails.schemaName;
      }

      const getFileDetails = await this.awsService.getFile(importFileDetails.fileKey);

      const csvData: string = getFileDetails.Body.toString();

      const parsedData = paParse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformheader: (header) => header.toLowerCase().replace('#', '').trim(),
        complete: (results) => results.data
      });

      if (0 >= parsedData.data.length) {
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.emptyFile);
      }

      if (0 >= parsedData.meta.fields.length) {
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.emptyheader);
      }
      const invalidEmails = parsedData.data.filter((entry) => !validateEmail(entry.email_identifier));

      if (0 < invalidEmails.length) {
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.invalidEmails);
      }
      
      const fileData: string[][] = parsedData.data.map(Object.values);
      const fileHeader: string[] = parsedData.meta.fields;
      const attributesArray = JSON.parse(credentialDetails.attributes);

      // Extract the 'attributeName' values from the objects and store them in an array
      const attributeNameArray = attributesArray.map((attribute) => attribute.attributeName);
      if (0 >= attributeNameArray.length) {
        throw new BadRequestException(`Attributes are empty for credential definition ${templateId}`);
      }

      let validatedData;

      if (type === SchemaType.W3C_Schema) {
        validatedData = parsedData.data.map((row) => {
          const { email_identifier, ...rest } = row;
          const newRow = { ...rest };
  
          attributesArray.forEach((attr) => {
            if (!(attr?.attributeName in newRow)) {
              throw new BadRequestException(`Missing attribute ${attr?.attributeName} in CSV data`);
            }
            if (W3CSchemaDataType.NUMBER === attr.schemaDataType) {
              newRow[attr?.attributeName] = Number(newRow[attr?.attributeName]);
              if (isNaN(newRow[attr.attributeName])) {
                throw new BadRequestException(`Invalid data type for attribute ${attr?.attributeName}`);
              }
            } else if (W3CSchemaDataType.STRING === attr?.schemaDataType) {
              newRow[attr?.attributeName] = String(newRow[attr?.attributeName]);
            }
          });
  
          return { email_identifier, ...newRow };
        });
      }

      const finalFileData = {
        data: validatedData,
        errors: [],
        meta: parsedData.meta
      };

      await this.validateFileHeaders(fileHeader, attributeNameArray);
      await this.validateFileData(fileData, attributesArray, fileHeader);

      credentialPayload.fileData = type === SchemaType.W3C_Schema ? finalFileData : parsedData;
      credentialPayload.fileName = fileName;
      const newCacheKey = uuidv4();

      await this.cacheManager.set(requestId ? requestId : newCacheKey, JSON.stringify(credentialPayload), 60000);
     
return newCacheKey;

} catch (error) {
      this.logger.error(`error in validating credentials : ${error.response}`);
      throw new RpcException(error.response ? error.response : error);
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
  
        // Apply search to the entire dataset if searchByText is provided
        let filteredData = parsedData;
        if (previewRequest.searchByText) {
          const searchTerm = previewRequest.searchByText.toLowerCase();
          filteredData = parsedData.filter(item => item.email_identifier.toLowerCase().includes(searchTerm) ||
            item.name.toLowerCase().includes(searchTerm)
          );
        }
  
        // Apply pagination to the filtered data
        const finalData = paginator(filteredData, previewRequest.pageNumber, previewRequest.pageSize);
  
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

      const templateIds = fileDetails?.fileList.map(file => file.templateId);

      const getSchemaDetails = await this._getSchemaDetails(templateIds);

      const fileListWithSchema = fileDetails?.fileList.map(file => {
        const schemaDetail = getSchemaDetails?.find(schema => schema.schemaLedgerId === file.templateId);
        return {
          ...file,
          schema: schemaDetail ? { name: schemaDetail.name, version: schemaDetail.version, schemaType: schemaDetail.type } : null
        };
      });

      const fileResponse = {
        totalItems: fileDetails.fileCount,
        hasNextPage: getAllfileDetails.pageSize * getAllfileDetails.pageNumber < fileDetails.fileCount,
        hasPreviousPage: 1 < getAllfileDetails.pageNumber,
        nextPage: Number(getAllfileDetails.pageNumber) + 1,
        previousPage: getAllfileDetails.pageNumber - 1,
        lastPage: Math.ceil(fileDetails.fileCount / getAllfileDetails.pageSize),
        data: fileListWithSchema
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

  async _getSchemaDetails(templateIds: string[]): Promise<ISchemaDetail[]> {
    const pattern = { cmd: 'get-schemas-details' };

    const payload = {
      templateIds
    };
    const schemaDetails = await this.issuanceServiceProxy
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
    return schemaDetails;
  }


  async delay(ms: number): Promise<unknown> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Processes bulk payload in batches and adds jobs to the queue.
   * @param bulkPayload
   * @param clientDetails 
   * @param orgId
   * @param requestId
   */
 
  private async processInBatches(bulkPayload, bulkPayloadDetails: BulkPayloadDetails):Promise<void> {
    const {clientId, isRetry, orgId, requestId} = bulkPayloadDetails;
    const delay = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const batchSize = CommonConstants.ISSUANCE_BATCH_SIZE; // initial 1000
    const uniqueJobId = uuidv4();
    const limit = pLimit(CommonConstants.ISSUANCE_MAX_CONCURRENT_OPERATIONS);

    // Generator function to yield batches
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function* createBatches(array, size) {
      for (let i = 0; i < array.length; i += size) {
        yield array.slice(i, i + size);
      }
    }

    // Helper function to process a batch
    const processBatch = async (batch, batchIndex): Promise<[]> => {
      const queueJobsArray = batch.map((item) => ({
        data: {
          id: item.id,
          jobId: uniqueJobId,
          cacheId: requestId,
          clientId,
          referenceId: item.referenceId,
          fileUploadId: item.fileUploadId,
          schemaLedgerId: item.schemaId,
          credentialDefinitionId: item.credDefId,
          status: item.status,
          credential_data: item.credential_data,
          orgId,
          credentialType: item.credential_type,
          totalJobs: bulkPayload.length,
          isRetry,
          isLastData: false,
          organizationLogoUrl: bulkPayloadDetails?.organizationLogoUrl,
          platformName: bulkPayloadDetails?.platformName,
          certificate: bulkPayloadDetails?.certificate,
          size: bulkPayloadDetails?.size,
          orientation: bulkPayloadDetails?.orientation
        }
      }));

      this.logger.log(`Processing batch ${batchIndex + 1} with ${batch.length} items.`);

      // Execute the batched jobs with limited concurrency
      await Promise.all(queueJobsArray.map(job => limit(() => job)));

      return queueJobsArray;
    };

    let batchIndex = 0;

    for (const batch of createBatches(bulkPayload, batchSize)) {
      const resolvedBatchJobs = await processBatch(batch, batchIndex);

      this.logger.log("Adding resolved jobs to the queue:", resolvedBatchJobs);
      await this.bulkIssuanceQueue.addBulk(resolvedBatchJobs);

      batchIndex++;

      // Wait for 60 seconds before processing the next batch, if more batches are remaining
      if ((batchIndex * batchSize) < bulkPayload.length) {
        await delay(CommonConstants.ISSUANCE_BATCH_DELAY);
      }
    }
  }

  /**
   * Handles bulk credential issuance.
   * @param requestId - The request ID.
   * @param orgId - The organization ID.
   * @param clientDetails - Client details.
   * @param reqPayload - Request payload containing file details.
   * @returns A promise resolving to a success message.
   */
  async issueBulkCredential(
    requestId: string,
    orgId: string,
    clientDetails: IClientDetails,
    reqPayload: ImportFileDetails
  ): Promise<string> {
    if (!requestId) {
      throw new BadRequestException(ResponseMessages.issuance.error.missingRequestId);
    }
    const fileUpload: FileUpload = {
      lastChangedDateTime: null,
      upload_type: '',
      status: '',
      orgId: '',
      createDateTime: null,
      name: '',
      credentialType: ''
    };

    let csvFileDetail;

    try {
      let cachedData = await this.cacheManager.get(requestId);
      if (!cachedData) {
        throw new BadRequestException(ResponseMessages.issuance.error.cacheTimeOut);
      }

      // For demo UI
      if (cachedData && clientDetails?.isSelectiveIssuance) {
        await this.cacheManager.del(requestId);
        await this.uploadCSVTemplate(reqPayload, requestId);
        cachedData = await this.cacheManager.get(requestId);
      }

      const parsedData = JSON.parse(cachedData as string).fileData.data;
      if (!parsedData) {
        throw new BadRequestException(ResponseMessages.issuance.error.cachedData);
      }
      const parsedFileDetails = JSON.parse(cachedData as string);
      if (!parsedFileDetails) {
        throw new BadRequestException(ResponseMessages.issuance.error.cachedfileData);
      }

      fileUpload.upload_type = FileUploadType.Issuance;
      fileUpload.status = FileUploadStatus.started;
      fileUpload.orgId = orgId;
      fileUpload.createDateTime = new Date();
      fileUpload.name = parsedFileDetails.fileName;
      fileUpload.credentialType = parsedFileDetails.credentialType;
      fileUpload.templateId = parsedFileDetails?.schemaLedgerId;
      csvFileDetail = await this.issuanceRepository.saveFileUploadDetails(fileUpload, clientDetails.userId);

      const bulkPayloadObject: IBulkPayloadObject = {
        parsedData,
        parsedFileDetails,
        userId: clientDetails.userId,
        fileUploadId: csvFileDetail.id
      };

      const storeBulkPayload = await this._storeBulkPayloadInBatch(bulkPayloadObject);

      if (!storeBulkPayload) {
        throw new BadRequestException(ResponseMessages.issuance.error.storeBulkData);
      }

      // Process in batches
      const bulkPayload = await this.issuanceRepository.getFileDetails(csvFileDetail.id);
      if (!bulkPayload) {
        throw new BadRequestException(ResponseMessages.issuance.error.fileData);
      }

      try {
    
        const bulkPayloadDetails: BulkPayloadDetails = {
          clientId: clientDetails.clientId,
          orgId,
          requestId,
          isRetry: false,
          organizationLogoUrl: clientDetails?.organizationLogoUrl,
          platformName: clientDetails?.platformName,
          certificate: clientDetails?.certificate,
          size: clientDetails?.size,
          orientation: clientDetails?.orientation
        };

         this.processInBatches(bulkPayload, bulkPayloadDetails);
      } catch (error) {
        this.logger.error(`Error processing issuance data: ${error}`);
      }

      return ResponseMessages.issuance.success.bulkProcess;
    } catch (error) {
      fileUpload.status = FileUploadStatus.interrupted;
      this.logger.error(`Error in issueBulkCredential: ${error}`);
      throw new RpcException(error.response);
    } finally {
      if (csvFileDetail !== undefined && csvFileDetail.id !== undefined) {
        fileUpload.lastChangedDateTime = new Date();
        await this.issuanceRepository.updateFileUploadDetails(csvFileDetail.id, fileUpload);
      }
    }
  }

  async retryBulkCredential(fileId: string, orgId: string, clientDetails: IClientDetails): Promise<string> {
    let bulkpayloadRetry;
    try {
      const fileDetails = await this.issuanceRepository.getFileDetailsById(fileId);
      if (!fileDetails) {
        throw new BadRequestException(ResponseMessages.issuance.error.retry);
      }
      bulkpayloadRetry = await this.issuanceRepository.getFailedCredentials(fileId);
      if (0 === bulkpayloadRetry.length) {
        const errorMessage = ResponseMessages.bulkIssuance.error.fileDetailsNotFound;
        throw new BadRequestException(`${errorMessage}`);
      }
      
      try {
        const bulkPayloadDetails: BulkPayloadDetails = {
          clientId : clientDetails.clientId,
          orgId,
          isRetry: true,
          organizationLogoUrl: clientDetails?.organizationLogoUrl,
          platformName: clientDetails?.platformName,
          certificate: clientDetails?.certificate,
          size: clientDetails?.size,
          orientation: clientDetails?.orientation
        };
        this.processInBatches(bulkpayloadRetry, bulkPayloadDetails);
       } catch (error) {
         this.logger.error(`Error processing issuance data: ${error}`);
       }
     
      return ResponseMessages.bulkIssuance.success.reinitiated;
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    }
  }

  
  async processIssuanceData(jobDetails: IQueuePayload): Promise<boolean> {
    const {jobId, totalJobs} = jobDetails;
    if (!this.processedJobsCounters[jobId]) {
      this.processedJobsCounters[jobId] = 0;
    }
    this.processedJobsCounters[jobId] += 1;
    if (this.processedJobsCounters[jobId] === totalJobs) {
      jobDetails.isLastData = true;
      delete this.processedJobsCounters[jobId];
    }

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
    fileUploadData.referenceId = jobDetails?.credential_data?.email_identifier;
    fileUploadData.jobId = jobDetails.id;
    const { orgId } = jobDetails;

    const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
    const { organisation, orgDid } = agentDetails;
    let prettyVc;
    let isErrorOccurred = false;
    try {
      let oobIssuancepayload;
      if (jobDetails.credentialType === SchemaType.INDY) {
        oobIssuancepayload = {
          credentialDefinitionId: jobDetails.credentialDefinitionId,
          orgId: jobDetails.orgId,
          label: organisation?.name,
          attributes: [],
          emailId: jobDetails?.credential_data?.email_identifier,
          credentialType: IssueCredentialType.INDY,
          isReuseConnection: true
        };
        for (const key in jobDetails?.credential_data) {

          if (jobDetails.credential_data.hasOwnProperty(key) && TemplateIdentifier.EMAIL_COLUMN !== key) {
            const value = jobDetails?.credential_data[key];
            oobIssuancepayload.attributes.push({ name: key, value });
          }
        }
      } else if (jobDetails.credentialType === SchemaType.W3C_Schema) {
      const schemaDetails = await this.issuanceRepository.getSchemaDetailsBySchemaIdentifier(jobDetails.schemaLedgerId);
      const {name, schemaLedgerId} = schemaDetails;
     const  JsonldCredentialDetails: IJsonldCredential = {
        schemaName : name,
        schemaLedgerId,
        credentialData: jobDetails.credential_data,
        orgDid,
        orgId,
        isReuseConnection: true
      };

      prettyVc = {
        certificate: jobDetails?.certificate,
        size: jobDetails?.size,
        orientation: jobDetails?.orientation
      };

      oobIssuancepayload = await createOobJsonldIssuancePayload(JsonldCredentialDetails, prettyVc);
      }

      const oobCredentials = await this.outOfBandCredentialOffer(
        oobIssuancepayload, jobDetails?.platformName, jobDetails?.organizationLogoUrl, prettyVc);
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
      }
    }
    await this.issuanceRepository.updateFileUploadData(fileUploadData);

    try {
      if (jobDetails.isLastData) {
        const socket = await io(`${process.env.SOCKET_HOST}`, {
          reconnection: true,
          reconnectionDelay: 5000,
          reconnectionAttempts: Infinity,
          autoConnect: true,
          transports: ['websocket']
        });
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
      const socket = await io(`${process.env.SOCKET_HOST}`, {
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionAttempts: Infinity,
        autoConnect: true,
        transports: ['websocket']
      });
      if (!isErrorOccurred) {
        isErrorOccurred = true;
        socket.emit('error-in-bulk-issuance-retry-process', { clientId: jobDetails.clientId, error });
      }
      throw error;

    }
  return true;
  }

  async splitIntoBatches<T>(array: T[], batchSize: number): Promise<T[][]> {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async validateFileHeaders(
    fileHeader: string[],
    schemaAttributes: string[]
  ): Promise<void> {
    try {
      const fileSchemaHeader: string[] = fileHeader.slice();
            if (TemplateIdentifier.EMAIL_COLUMN === fileHeader[0]) {
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

  async validateFileData(fileData: string[][], attributesArray: { attributeName: string, schemaDataType: string, displayName: string, isRequired: boolean }[], fileHeader: string[]): Promise<void> {
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

  async _storeBulkPayloadInBatch(bulkPayloadObject: IBulkPayloadObject): Promise<boolean> {
    try {
      const {parsedFileDetails, parsedData, fileUploadId, userId} = bulkPayloadObject;
      
      const limit = pLimit(CommonConstants.MAX_CONCURRENT_OPERATIONS);
      const startTime = Date.now();
      const batches = await this.splitIntoBatches(parsedData, CommonConstants.BATCH_SIZE);
      this.logger.log("Total number of batches:", batches.length);
      
      for (const [index, batch] of batches.entries()) {
      
        const batchStartTime = Date.now(); 
      
        // Create an array of limited promises for the current batch
        const saveFileDetailsPromises = batch.map(element => limit(() => {
            const credentialPayload = {
              credential_data: element,
              schemaId: parsedFileDetails.schemaLedgerId,
              schemaName: parsedFileDetails.schemaName,
              credDefId: parsedFileDetails.credentialDefinitionId,
              state: false,
              isError: false,
              fileUploadId,
              credentialType: parsedFileDetails.credentialType
            };
            return this.issuanceRepository.saveFileDetails(credentialPayload, userId);
          })
        );
      
        this.logger.log(`Processing batch ${index + 1} with ${batch.length} elements...`);
      
        // Wait for all operations in the current batch to complete before moving to the next batch
        await Promise.all(saveFileDetailsPromises);
      
        const batchEndTime = Date.now(); // End timing the current batch
        this.logger.log(`Batch ${index + 1} processed in ${(batchEndTime - batchStartTime)} milliseconds.`);
      }
      
      const endTime = Date.now();
      this.logger.log(`Total processing time: ${(endTime - startTime)} milliseconds.`);
      return true;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }

  async deleteIssuanceRecords(orgId: string, userDetails: user): Promise<IDeletedIssuanceRecords> {
    try {

      const getFileUploadData = await this.issuanceRepository.getFileUploadDataByOrgId(orgId);

      const getFileUploadIds = getFileUploadData.map(fileData => fileData.id);
  
      await this.issuanceRepository.deleteFileUploadData(getFileUploadIds, orgId);

      const deletedCredentialsRecords = await this.issuanceRepository.deleteIssuanceRecordsByOrgId(orgId);
      
      if (0 === deletedCredentialsRecords?.deleteResult?.count) {
        throw new NotFoundException(ResponseMessages.issuance.error.issuanceRecordsNotFound);
      }

    const statusCounts = {
        [IssuanceProcessState.REQUEST_SENT]: 0,
        [IssuanceProcessState.REQUEST_RECEIVED]: 0,
        [IssuanceProcessState.PROPOSAL_SENT]: 0,
        [IssuanceProcessState.PROPOSAL_RECEIVED]: 0,
        [IssuanceProcessState.OFFER_SENT]: 0,
        [IssuanceProcessState.OFFER_RECEIVED]: 0,
        [IssuanceProcessState.DONE]: 0,
        [IssuanceProcessState.DECLIEND]: 0,
        [IssuanceProcessState.CREDENTIAL_RECEIVED]: 0,
        [IssuanceProcessState.CREDENTIAL_ISSUED]: 0,
        [IssuanceProcessState.ABANDONED]: 0
    };

    await Promise.all(deletedCredentialsRecords?.recordsToDelete?.map(async (record) => {
        statusCounts[record.state]++;
    }));

    const filteredStatusCounts = Object.fromEntries(
      Object.entries(statusCounts).filter(entry => 0 < entry[1])
    );

      const deletedIssuanceData = {
        deletedCredentialsRecordsCount : deletedCredentialsRecords?.deleteResult?.count,
        deletedRecordsStatusCount: filteredStatusCounts
      }; 

      await this.userActivityRepository._orgDeletedActivity(orgId, userDetails, deletedIssuanceData, RecordType.ISSUANCE_RECORD);
    
      return deletedCredentialsRecords;
    } catch (error) {
      this.logger.error(`[deleteIssuanceRecords] - error in deleting issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  
}
