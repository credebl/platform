/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */
// TODO: Remove this
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
import { credential_templates, oidc_issuer, user } from '@prisma/client';
import { CreateCredentialTemplate, UpdateCredentialTemplate } from '../interfaces/oidc-template.interface';
import { IssuerCreation, IssuerUpdation } from '../interfaces/oidc-issuance.interfaces';
import {
  CreateOidcCredentialOffer,
  GetAllCredentialOffer,
  UpdateCredentialRequest
} from '../interfaces/oidc-issuer-sessions.interfaces';
import { OIDCIssuanceService } from './oidc-issuance.service';

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

  @MessagePattern({ cmd: 'oidc-issuer-create' })
  async oidcIssuerCreate(payload: {
    issueCredentialDto: IssuerCreation;
    orgId: string;
    userDetails: user;
  }): Promise<oidc_issuer> {
    const { issueCredentialDto, orgId, userDetails } = payload;
    return this.oidcIssuanceService.oidcIssuerCreate(issueCredentialDto, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oidc-issuer-update' })
  async oidcIssuerUpdate(payload: {
    issueUpdationDto: IssuerUpdation;
    orgId: string;
    userDetails: user;
  }): Promise<oidc_issuer> {
    const { issueUpdationDto, orgId, userDetails } = payload;
    return this.oidcIssuanceService.oidcIssuerUpdate(issueUpdationDto, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oidc-issuer-get-by-id' })
  async oidcGetIssuerById(payload: {
    issuerId: string;
    orgId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { issuerId, orgId } = payload;
    return this.oidcIssuanceService.oidcIssuerGetById(issuerId, orgId);
  }

  @MessagePattern({ cmd: 'oidc-get-issuers-issuance' })
  async oidcGetIssuers(payload: { orgId: string }): Promise<object> {
    const { orgId } = payload;
    return this.oidcIssuanceService.oidcIssuers(orgId);
  }

  @MessagePattern({ cmd: 'oidc-delete-issuer' })
  async deleteOidcIssuer(payload: {
    orgId: string;
    userDetails: user;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.deleteOidcIssuer(orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-create' })
  async oidcTemplateCreate(payload: {
    CredentialTemplate: CreateCredentialTemplate;
    orgId: string;
    issuerId: string;
  }): Promise<credential_templates> {
    const { CredentialTemplate, orgId, issuerId } = payload;
    return this.oidcIssuanceService.createTemplate(CredentialTemplate, orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-update' })
  async oidcTemplateUpdate(payload: {
    templateId: string;
    dto: UpdateCredentialTemplate;
    orgId: string;
    issuerId: string;
  }): Promise<credential_templates> {
    const { templateId, dto, orgId, issuerId } = payload;
    return this.oidcIssuanceService.updateTemplate(templateId, dto, orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-delete' })
  async oidcTemplateDelete(payload: {
    templateId: string;
    orgId: string;
    userDetails: user;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { templateId, orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.deleteTemplate(templateId, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-template-find-id' })
  async oidcTemplateFindById(payload: {
    templateId: string;
    orgId: string;
    userDetails: user;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  @MessagePattern({ cmd: 'oidc-create-credential-offer' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOidcCredentialOffer(payload: {
    oidcCredentialPayload: CreateOidcCredentialOffer;
    orgId: string;
    userDetails: user;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { oidcCredentialPayload, orgId, userDetails, issuerId } = payload;
    return this.oidcIssuanceService.createOidcCredentialOffer(oidcCredentialPayload, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-update-credential-offer' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateOidcCredentialOffer(payload: {
    oidcUpdateCredentialPayload: UpdateCredentialRequest;
    orgId: string;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { oidcUpdateCredentialPayload, orgId, issuerId } = payload;
    return this.oidcIssuanceService.updateOidcCredentialOffer(oidcUpdateCredentialPayload, orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oidc-credential-offer-get-by-id' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCredentialOfferDetailsById(payload: {
    offerId: string;
    orgId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { offerId, orgId } = payload;
    return this.oidcIssuanceService.getCredentialOfferDetailsById(offerId, orgId);
  }
  @MessagePattern({ cmd: 'oidc-credential-offer-get-all' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllCredentialOffers(payload: {
    orgId: string;
    getAllCredentialOffer: GetAllCredentialOffer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { orgId, getAllCredentialOffer } = payload;
    return this.oidcIssuanceService.getCredentialOffers(orgId, getAllCredentialOffer);
  }

  @MessagePattern({ cmd: 'oidc-credential-offer-delete' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteCredentialOffers(payload: {
    orgId: string;
    credentialId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { orgId, credentialId } = payload;
    return this.oidcIssuanceService.deleteCredentialOffers(orgId, credentialId);
  }

  //TODO: complete the logic
  @MessagePattern({ cmd: 'webhook-oidc-issue-credential' })
  async oidcIssueCredentialWebhook(payload: IssueCredentialWebhookPayload): Promise<object> {
    return this.issuanceService.getIssueCredentialWebhook(payload);
  }
}
