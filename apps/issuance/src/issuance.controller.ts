import {
  IClientDetails,
  IIssuance,
  IIssueCredentials,
  IIssueCredentialsDefinitions,
  ImportFileDetails,
  IssueCredentialWebhookPayload,
  OutOfBandCredentialOffer,
  PreviewRequest,
  TemplateDetailsInterface
} from '../interfaces/issuance.interfaces';
import {
  ICredentialOfferResponse,
  IDeletedIssuanceRecords,
  IIssuedCredential
} from '@credebl/common/interfaces/issuance.interface';

import { Controller } from '@nestjs/common';
import { IssuanceService } from './issuance.service';
import { MessagePattern } from '@nestjs/microservices';
import { OOBIssueCredentialDto } from 'apps/api-gateway/src/issuance/dtos/issuance.dto';
import { user } from '@prisma/client';
import { IssuerCreation } from '../interfaces/oidc-issuance.interfaces';
import { OIDCIssuanceService } from './oidc-issuance.service';
import { CreateCredentialTemplate, UpdateCredentialTemplate } from '../interfaces/oidc-template.interface';

@Controller()
export class IssuanceController {
  constructor(
    private readonly issuanceService: IssuanceService,
    private readonly oidcIssuanceService: OIDCIssuanceService
  ) {}

  @MessagePattern({ cmd: 'get-issuance-records' })
  async getIssuanceRecordsByOrgId(payload: { orgId: string; userId: string }): Promise<number> {
    const { orgId } = payload;
    return this.issuanceService.getIssuanceRecords(orgId);
  }

  @MessagePattern({ cmd: 'send-credential-create-offer' })
  async sendCredentialCreateOffer(payload: IIssuance): Promise<ICredentialOfferResponse> {
    return this.issuanceService.sendCredentialCreateOffer(payload);
  }

  @MessagePattern({ cmd: 'send-credential-create-offer-oob' })
  async sendCredentialOutOfBand(payload: OOBIssueCredentialDto): Promise<{ response: object }> {
    return this.issuanceService.sendCredentialOutOfBand(payload);
  }

  @MessagePattern({ cmd: 'get-all-issued-credentials' })
  async getIssueCredentials(payload: IIssueCredentials): Promise<IIssuedCredential> {
    const { user, orgId, issuedCredentialsSearchCriteria } = payload;
    return this.issuanceService.getIssueCredentials(user, orgId, issuedCredentialsSearchCriteria);
  }

  @MessagePattern({ cmd: 'get-issued-credentials-by-credentialDefinitionId' })
  async getIssueCredentialsbyCredentialRecordId(payload: IIssueCredentialsDefinitions): Promise<string> {
    const { user, credentialRecordId, orgId } = payload;
    return this.issuanceService.getIssueCredentialsbyCredentialRecordId(user, credentialRecordId, orgId);
  }

  @MessagePattern({ cmd: 'webhook-get-issue-credential' })
  async getIssueCredentialWebhook(payload: IssueCredentialWebhookPayload): Promise<object> {
    return this.issuanceService.getIssueCredentialWebhook(payload);
  }

  @MessagePattern({ cmd: 'out-of-band-credential-offer' })
  async outOfBandCredentialOffer(payload: OutOfBandCredentialOffer): Promise<boolean> {
    const { outOfBandCredentialDto } = payload;
    return this.issuanceService.outOfBandCredentialOffer(outOfBandCredentialDto);
  }

  @MessagePattern({ cmd: 'download-csv-template-for-bulk-operation' })
  async downloadBulkIssuanceCSVTemplate(payload: {
    orgId: string;
    templateDetails: TemplateDetailsInterface;
  }): Promise<object> {
    const { orgId, templateDetails } = payload;
    return this.issuanceService.downloadBulkIssuanceCSVTemplate(orgId, templateDetails);
  }

  @MessagePattern({ cmd: 'upload-csv-template' })
  async uploadCSVTemplate(payload: { importFileDetails: ImportFileDetails; orgId: string }): Promise<string> {
    return this.issuanceService.uploadCSVTemplate(payload.importFileDetails, payload.orgId);
  }

  @MessagePattern({ cmd: 'preview-csv-details' })
  async previewCSVDetails(payload: { requestId: string; previewFileDetails: PreviewRequest }): Promise<object> {
    return this.issuanceService.previewFileDataForIssuance(payload.requestId, payload.previewFileDetails);
  }

  @MessagePattern({ cmd: 'issued-file-details' })
  async issuedFiles(payload: { orgId: string; fileParameter: PreviewRequest }): Promise<object> {
    return this.issuanceService.issuedFileDetails(payload.orgId, payload.fileParameter);
  }
  @MessagePattern({ cmd: 'issued-file-data' })
  async getFileDetailsByFileId(payload: { fileId: string; fileParameter: PreviewRequest }): Promise<object> {
    return this.issuanceService.getFileDetailsByFileId(payload.fileId, payload.fileParameter);
  }

  @MessagePattern({ cmd: 'issue-bulk-credentials' })
  async issueBulkCredentials(payload: {
    requestId: string;
    orgId: string;
    clientDetails: IClientDetails;
    reqPayload: ImportFileDetails;
    isValidateSchema: boolean;
  }): Promise<string> {
    return this.issuanceService.issueBulkCredential(
      payload.requestId,
      payload.orgId,
      payload.clientDetails,
      payload.reqPayload,
      payload.isValidateSchema
    );
  }

  @MessagePattern({ cmd: 'retry-bulk-credentials' })
  async retryeBulkCredentials(payload: {
    fileId: string;
    orgId: string;
    clientDetails: IClientDetails;
    isValidateSchema?: boolean;
  }): Promise<string> {
    return this.issuanceService.retryBulkCredential(
      payload.fileId,
      payload.orgId,
      payload.clientDetails,
      payload.isValidateSchema
    );
  }

  @MessagePattern({ cmd: 'delete-issuance-records' })
  async deleteIssuanceRecords(payload: { orgId: string; userDetails: user }): Promise<IDeletedIssuanceRecords> {
    const { orgId, userDetails } = payload;
    return this.issuanceService.deleteIssuanceRecords(orgId, userDetails);
  }
  @MessagePattern({ cmd: 'issued-file-data-and-file-details' })
  async getFileDetailsAndFileDataByFileId(payload: { fileId: string; orgId: string }): Promise<object> {
    return this.issuanceService.getFileDetailsAndFileDataByFileId(payload.fileId, payload.orgId);
  }

  // oidc-issuer-create
  @MessagePattern({ cmd: 'oidc-issuer-create' })
  async oidcIssuerCreate(payload: {
    issuerCreation: IssuerCreation;
    orgId: string;
    userDetails: user;
  }): Promise<IDeletedIssuanceRecords> {
    const { orgId, userDetails } = payload;
    return this.oidcIssuanceService.oidcIssuerCreate(payload.issuerCreation, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oidc-template-create' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async oidcTemplateCreate(payload: {
    dto: CreateCredentialTemplate;
    orgId: string;
    userDetails: user;
    issuerId: string;
  }): Promise<any> {
    const { dto, orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.createTemplate(dto, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-update' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async oidcTemplateUpdate(payload: {
    templateId: string;
    dto: UpdateCredentialTemplate;
    orgId: string;
    userDetails: user;
    issuerId: string;
  }): Promise<any> {
    const { templateId, dto, orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.updateTemplate(templateId, dto, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-delete' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async oidcTemplateDelete(payload: {
    templateId: string;
    orgId: string;
    userDetails: user;
    issuerId: string;
  }): Promise<any> {
    const { templateId, orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.deleteTemplate(templateId, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-find-id' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async oidcTemplateFindById(payload: {
    templateId: string;
    orgId: string;
    userDetails: user;
    issuerId: string;
  }): Promise<any> {
    const { templateId, orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.findByIdTemplate(templateId, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-find-all' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async oidcTemplateFindAll(payload: { orgId: string; userDetails: user; issuerId: string }): Promise<any> {
    const { orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.findAllTemplate(orgId, userDetails, issuerId);
  }
}
