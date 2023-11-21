/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
import { CommonService } from '@credebl/common';
import { BadRequestException, HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IssuanceRepository } from './issuance.repository';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import { FileUploadData, ICredentialAttributesInterface, ImportFileDetails, OutOfBandCredentialOfferPayload, PreviewRequest, SchemaDetails } from '../interfaces/issuance.interfaces';
import { OrgAgentType } from '@credebl/enum/enum';
import { platform_config } from '@prisma/client';
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

@Injectable()
export class IssuanceService {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceServiceProxy: ClientProxy,
    private readonly commonService: CommonService,
    private readonly issuanceRepository: IssuanceRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly outOfBandIssuance: OutOfBandIssuance,
    private readonly emailData: EmailDto,
    private readonly awsService: AwsService,
    @InjectQueue('bulk-issuance') private bulkIssuanceQueue: Queue
  ) { }


  async sendCredentialCreateOffer(orgId: number, user: IUserRequest, credentialDefinitionId: string, comment: string, connectionId: string, attributes: object[]): Promise<string> {
    try {
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      const platformConfig: platform_config = await this.issuanceRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const issuanceMethodLabel = 'create-offer';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId);

      const apiKey = platformConfig?.sgApiKey;
      const issueData = {
        protocolVersion: 'v1',
        connectionId,
        credentialFormats: {
          indy: {
            attributes,
            credentialDefinitionId
          }
        },
        autoAcceptCredential: 'always',
        comment
      };

      const credentialCreateOfferDetails = await this._sendCredentialCreateOffer(issueData, url, apiKey);

      return credentialCreateOfferDetails?.response;
    } catch (error) {
      this.logger.error(`[sendCredentialCreateOffer] - error in create credentials : ${JSON.stringify(error)}`);
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


  async sendCredentialOutOfBand(orgId: string, user: IUserRequest, credentialDefinitionId: string, comment: string, connectionId: string, attributes: object[]): Promise<string> {
    try {
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      // eslint-disable-next-line camelcase
      const platformConfig: platform_config = await this.issuanceRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const issuanceMethodLabel = 'create-offer-oob';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId);

      const apiKey = platformConfig?.sgApiKey;
      const issueData = {
        connectionId,
        credentialFormats: {
          indy: {
            attributes,
            credentialDefinitionId
          }
        },
        autoAcceptCredential: 'always',
        comment
      };
      const credentialCreateOfferDetails = await this._sendCredentialCreateOffer(issueData, url, apiKey);

      return credentialCreateOfferDetails?.response;
    } catch (error) {
      this.logger.error(`[sendCredentialCreateOffer] - error in create credentials : ${JSON.stringify(error)}`);
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
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _sendCredentialCreateOffer(issueData: object, url: string, apiKey: string): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-send-credential-create-offer' };
      const payload = { issueData, url, apiKey };
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_sendCredentialCreateOffer] [NATS call]- error in create credentials : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getIssueCredentials(user: IUserRequest, threadId: string, connectionId: string, state: string, orgId: string): Promise<string> {
    try {
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      const platformConfig: platform_config = await this.issuanceRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const params = {
        threadId,
        connectionId,
        state
      };

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const issuanceMethodLabel = 'get-issue-credentials';
      let url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId);

      Object.keys(params).forEach((element: string) => {
        const appendParams: string = url.includes('?') ? '&' : '?';

        if (params[element] !== undefined) {
          url = `${url + appendParams + element}=${params[element]}`;
        }
      });
      const apiKey = platformConfig?.sgApiKey;
      const issueCredentialsDetails = await this._getIssueCredentials(url, apiKey);
      return issueCredentialsDetails?.response;
    } catch (error) {
      this.logger.error(`[sendCredentialCreateOffer] - error in create credentials : ${JSON.stringify(error)}`);
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
      const platformConfig: platform_config = await this.issuanceRepository.getPlatformConfigDetails();

      const { agentEndPoint } = agentDetails;
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const issuanceMethodLabel = 'get-issue-credential-by-credential-id';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentEndPoint, agentDetails?.tenantId, credentialRecordId);

      const apiKey = platformConfig?.sgApiKey;
      const createConnectionInvitation = await this._getIssueCredentialsbyCredentialRecordId(url, apiKey);
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

  async getIssueCredentialWebhook(createDateTime: string, connectionId: string, threadId: string, protocolVersion: string, credentialAttributes: ICredentialAttributesInterface[], orgId: string): Promise<object> {
    try {
      const agentDetails = await this.issuanceRepository.saveIssuedCredentialDetails(createDateTime, connectionId, threadId, protocolVersion, credentialAttributes, orgId);
      return agentDetails;
    } catch (error) {
      this.logger.error(`[getIssueCredentialsbyCredentialRecordId] - error in get credentials : ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getIssueCredentialsbyCredentialRecordId(url: string, apiKey: string): Promise<{
    response: string;
  }> {
    try {
      const pattern = { cmd: 'agent-get-issued-credentials-by-credentialDefinitionId' };
      const payload = { url, apiKey };
      return await this.natsCall(pattern, payload);

    } catch (error) {
      this.logger.error(`[_getIssueCredentialsbyCredentialRecordId] [NATS call]- error in fetch credentials : ${JSON.stringify(error)}`);
      throw error;
    }
  }


  async outOfBandCredentialOffer(outOfBandCredential: OutOfBandCredentialOfferPayload): Promise<boolean | object[]> {
    try {
      const {
        credentialOffer,
        comment,
        credentialDefinitionId,
        orgId,
        protocolVersion,
        attributes,
        emailId
      } = outOfBandCredential;

      // Define a batch size
      const batchSize = 100; // Adjust this based on your needs

      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      const issuanceMethodLabel = 'create-offer-oob';
      const url = await this.getAgentUrl(issuanceMethodLabel, orgAgentType, agentDetails.agentEndPoint, agentDetails.tenantId);
      const organizationDetails = await this.issuanceRepository.getOrganization(orgId);

      if (!organizationDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.organizationNotFound);
      }

      const { apiKey } = agentDetails;

      const errors = [];
      const emailPromises = [];

      const sendEmailForCredentialOffer = async (iterator, emailId): Promise<boolean> => {
        try {
          const outOfBandIssuancePayload = {
            protocolVersion: protocolVersion || 'v1',
            credentialFormats: {
              indy: {
                attributes: iterator.attributes || attributes,
                credentialDefinitionId
              }
            },
            autoAcceptCredential: 'always',
            comment,
            label: organizationDetails?.name
          };


          const credentialCreateOfferDetails = await this._outOfBandCredentialOffer(outOfBandIssuancePayload, url, apiKey);
          if (!credentialCreateOfferDetails) {
            errors.push(ResponseMessages.issuance.error.credentialOfferNotFound);
            return false;
          }

          const invitationId = credentialCreateOfferDetails.response.invitation['@id'];
          if (!invitationId) {
            errors.push(ResponseMessages.issuance.error.invitationNotFound);
            return false;
          }

          const agentEndPoint = agentDetails.tenantId
            ? `${agentDetails.agentEndPoint}/multi-tenancy/url/${agentDetails.tenantId}/${invitationId}`
            : `${agentDetails.agentEndPoint}/url/${invitationId}`;

          const qrCodeOptions = { type: 'image/png' };
          const outOfBandIssuanceQrCode = await QRCode.toDataURL(agentEndPoint, qrCodeOptions);
          const platformConfigData = await this.issuanceRepository.getPlatformConfigDetails();

          if (!platformConfigData) {
            errors.push(ResponseMessages.issuance.error.platformConfigNotFound);
            return false;
          }

          this.emailData.emailFrom = platformConfigData.emailFrom;
          this.emailData.emailTo = emailId;
          this.emailData.emailSubject = `${process.env.PLATFORM_NAME} Platform: Issuance of Your Credentials`;
          this.emailData.emailHtml = await this.outOfBandIssuance.outOfBandIssuance(emailId, organizationDetails.name, outOfBandIssuanceQrCode);
          this.emailData.emailAttachments = [
            {
              filename: 'qrcode.png',
              content: outOfBandIssuanceQrCode.split(';base64,')[1],
              contentType: 'image/png',
              disposition: 'attachment'
            }
          ];

          const isEmailSent = await sendEmail(this.emailData);
          if (!isEmailSent) {
            errors.push(ResponseMessages.issuance.error.emailSend);
            return false;
          }

          return isEmailSent;
        } catch (error) {
          errors.push(error.message);
          return false;
        }
      };

      if (credentialOffer) {
        for (let i = 0; i < credentialOffer.length; i += batchSize) {
          const batch = credentialOffer.slice(i, i + batchSize);

          // Process each batch in parallel
          const batchPromises = batch.map((iterator) => sendEmailForCredentialOffer(iterator, iterator.emailId));

          emailPromises.push(Promise.all(batchPromises));
        }
      } else {
        emailPromises.push(sendEmailForCredentialOffer({}, emailId));
      }

      const results = await Promise.all(emailPromises);

      // Flatten the results array
      const flattenedResults = [].concat(...results);

      // Check if all emails were successfully sent
      const allSuccessful = flattenedResults.every((result) => true === result);

      if (0 < errors.length) {
        throw errors;
      }

      return allSuccessful;
    } catch (error) {
      this.logger.error(`[outOfBoundCredentialOffer] - error in create out-of-band credentials: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }


  async _outOfBandCredentialOffer(outOfBandIssuancePayload: object, url: string, apiKey: string): Promise<{
    response;
  }> {
    try {
      const pattern = { cmd: 'agent-out-of-band-credential-offer' };
      const payload = { outOfBandIssuancePayload, url, apiKey };
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


      let processedFileName: string = credentialDefinitionId;
      processedFileName = processedFileName.replace(/[\/:*?"<>|]/g, '_');
      const timestamp = Math.floor(Date.now() / 1000);
      const fileName = `${processedFileName}-${timestamp}.csv`;

      await createFile(filePath, fileName, csv);
      this.logger.log(`File created - ${fileName}`);
      const fullFilePath = join(process.cwd(), `uploadedFiles/exports/${fileName}`);

      if (!checkIfFileOrDirectoryExists(fullFilePath)) {
        throw new NotFoundException(ResponseMessages.bulkIssuance.error.PathNotFound);
      }

      // https required to download csv from frontend side
      const filePathToDownload = `${process.env.API_GATEWAY_PROTOCOL_SECURE}://${process.env.UPLOAD_LOGO_HOST}/${fileName}`;
      return {
        fileContent: filePathToDownload,
        fileName: processedFileName
      };
    } catch (error) {
      throw new Error('An error occurred during CSV export.');
    }
  }


  async importAndPreviewDataForIssuance(importFileDetails: ImportFileDetails): Promise<string> {
    this.logger.log(`START importAndPreviewDataForIssuance----${JSON.stringify(importFileDetails)}`);
    try {

      const credDefResponse =
        await this.issuanceRepository.getCredentialDefinitionDetails(importFileDetails.credDefId);

      this.logger.log(`credDefResponse----${JSON.stringify(credDefResponse)}`);

      this.logger.log(`csvFile::::::${JSON.stringify(importFileDetails.fileKey)}`);

      const getFileDetails = await this.awsService.getFile(importFileDetails.fileKey);
      const csvData: string = getFileDetails.Body.toString();

      const parsedData = paParse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformheader: (header) => header.toLowerCase().replace('#', '').trim(),
        complete: (results) => results.data
      });

      this.logger.log(`parsedData----${JSON.stringify(parsedData)}`);

      if (0 >= parsedData.data.length) {
        throw new BadRequestException(`File data is empty`);
      }

      if (0 >= parsedData.meta.fields.length) {
        throw new BadRequestException(`File header is empty`);
      }

      const fileData: string[] = parsedData.data.map(Object.values);
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
      await this.validateFileData(fileData);

      const resData = {
        schemaLedgerId: credDefResponse.schemaLedgerId,
        credentialDefinitionId: importFileDetails.credDefId,
        fileData: parsedData,
        fileName: importFileDetails.fileName
      };
      const newCacheKey = uuidv4();

      await this.cacheManager.set(newCacheKey, JSON.stringify(resData), 3600);

      return newCacheKey;

    } catch (error) {
      this.logger.error(`error in validating credentials : ${error}`);
      throw new RpcException(error.response ? error.response : error);
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
        parsedData.sort(orderValues(previewRequest.sortBy, previewRequest.sortValue));
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
        nextPage: getAllfileDetails.pageNumber + 1,
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
        nextPage: getAllfileDetails.pageNumber + 1,
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

  async issueBulkCredential(requestId: string, orgId: number, clientId: string): Promise<string> {
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

    this.logger.log(`requestId----${JSON.stringify(requestId)}`);
    try {
      const cachedData = await this.cacheManager.get(requestId);
      this.logger.log(`cachedData----${JSON.stringify(cachedData)}`);
      if (!cachedData) {
        throw new BadRequestException(ResponseMessages.issuance.error.cacheTimeOut);
      }

      const parsedData = JSON.parse(cachedData as string).fileData.data;
      const parsedPrimeDetails = JSON.parse(cachedData as string);
      fileUpload.upload_type = FileUploadType.Issuance;
      fileUpload.status = FileUploadStatus.started;
      fileUpload.orgId = String(orgId);
      fileUpload.createDateTime = new Date();

      if (parsedPrimeDetails && parsedPrimeDetails.fileName) {
        fileUpload.name = parsedPrimeDetails.fileName;
      }

      respFileUpload = await this.issuanceRepository.saveFileUploadDetails(fileUpload);

      const saveFileDetailsPromises = parsedData.map(async (element) => {
        const credentialPayload = {
          credential_data: element,
          schemaId: parsedPrimeDetails.schemaLedgerId,
          credDefId: parsedPrimeDetails.credentialDefinitionId,
          state: false,
          isError: false,
          fileUploadId: respFileUpload.id
        };
        return this.issuanceRepository.saveFileDetails(credentialPayload);
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
          this.logger.log(`element----${JSON.stringify(element)}`);
          const payload = {
            data: element.credential_data,
            fileUploadId: element.fileUploadId,
            clientId,
            cacheId: requestId,
            credentialDefinitionId: element.credDefId,
            schemaLedgerId: element.schemaId,
            isRetry: false,
            orgId,
            id: element.id,
            isLastData: respFile.indexOf(element) === respFile.length - 1
          };

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

  async retryBulkCredential(fileId: string, orgId: number, clientId: string): Promise<string> {
    let respFile;
    let respFileUpload;

    try {

      const fileDetails = await this.issuanceRepository.getFileDetailsById(fileId);
      if (!fileDetails) {
        throw new BadRequestException(ResponseMessages.issuance.error.retry);
      }

      respFileUpload = await this.issuanceRepository.updateFileUploadStatus(fileId);
      respFile = await this.issuanceRepository.getFailedCredentials(fileId);

      if (0 === respFile.length) {
        const errorMessage = ResponseMessages.bulkIssuance.error.fileDetailsNotFound;
        throw new BadRequestException(`${errorMessage}`);
      }

      for (const element of respFile) {
        try {
          this.logger.log(`element----${JSON.stringify(element)}`);
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

          await this.processIssuanceData(payload);
        } catch (error) {
          // Handle errors if needed
          this.logger.error(`Error processing issuance data: ${error}`);
        }
      }

      return 'Process reinitiated for bulk issuance';
    } catch (error) {
      throw new RpcException(error.response ? error.response : error);
    } finally {
      // Update file upload details in the database
      if (respFileUpload && respFileUpload.id) {
        const fileUpload = {
          status: FileUploadStatus.interrupted,
          lastChangedDateTime: new Date()
        };

        await this.issuanceRepository.updateFileUploadDetails(respFileUpload.id, fileUpload);
      }
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
    this.logger.log(`jobDetails----${JSON.stringify(jobDetails)}`);

    fileUploadData.fileUpload = jobDetails.fileUploadId;
    fileUploadData.fileRow = JSON.stringify(jobDetails);
    fileUploadData.isError = false;
    fileUploadData.createDateTime = new Date();
    fileUploadData.referenceId = jobDetails.data.email;
    fileUploadData.jobId = jobDetails.id;
    try {

      const oobIssuancepayload = {
        credentialDefinitionId: jobDetails.credentialDefinitionId,
        orgId: jobDetails.orgId,
        attributes: [],
        emailId: jobDetails.data.email
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
        `error in issuanceBulkCredential for data ${JSON.stringify(jobDetails)} : ${JSON.stringify(error)}`
      );
      fileUploadData.isError = true;
      fileUploadData.error = error.message;
      fileUploadData.detailError = `${JSON.stringify(error)}`;
    }
    await this.issuanceRepository.updateFileUploadData(fileUploadData);

    try {
      if (jobDetails.isLastData) {
        if (!jobDetails.isRetry) {
          this.cacheManager.del(jobDetails.cacheId);
          await this.issuanceRepository.updateFileUploadDetails(jobDetails.fileUploadId, {
            status: FileUploadStatus.completed,
            lastChangedDateTime: new Date()
          });
        } else {
          await this.issuanceRepository.updateFileUploadDetails(jobDetails.fileUploadId, {
            status: FileUploadStatus.completed,
            lastChangedDateTime: new Date()
          });
        }

        this.logger.log(`jobDetails.clientId----${JSON.stringify(jobDetails.clientId)}`);

        socket.emit('bulk-issuance-process-completed', { clientId: jobDetails.clientId });
      }
    } catch (error) {
      this.logger.error(`Error completing bulk issuance process: ${error}`);
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
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.attributeNumber
        );
      }

      const mismatchedAttributes = fileSchemaHeader.filter(value => !schemaAttributes.includes(value));

      if (0 < mismatchedAttributes.length) {
        throw new BadRequestException(ResponseMessages.bulkIssuance.error.mismatchedAttributes);
      }
    } catch (error) {
      throw error;

    }
  }

  async validateFileData(fileData: string[]): Promise<void> {
    let rowIndex: number = 0;
    let columnIndex: number = 0;
    const isNullish = Object.values(fileData).some((value) => {
      columnIndex = 0;
      rowIndex++;
      const isFalsyForColumnValue = Object.values(value).some((colvalue) => {
        columnIndex++;
        if (null === colvalue || '' == colvalue) {
          return true;
        }
        return false;
      });
      return isFalsyForColumnValue;
    });
    this.logger.log(`isNullish: ${isNullish}`);
    if (isNullish) {
      throw new BadRequestException(
        `Empty data found at row ${rowIndex} and column ${columnIndex}`
      );
    }
  }

}
