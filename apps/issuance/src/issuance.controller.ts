import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IIssuance, IIssuanceWebhookInterface, IIssueCredentials, IIssueCredentialsDefinitions, ImportFileDetails, OutOfBandCredentialOffer, PreviewRequest } from '../interfaces/issuance.interfaces';
import { IssuanceService } from './issuance.service';

@Controller()
export class IssuanceController {
  private readonly logger = new Logger('issuanceService');
  constructor(private readonly issuanceService: IssuanceService) { }

  @MessagePattern({ cmd: 'send-credential-create-offer' })
  async sendCredentialCreateOffer(payload: IIssuance): Promise<string> {
    const { orgId, user, credentialDefinitionId, comment, connectionId, attributes } = payload;
    return this.issuanceService.sendCredentialCreateOffer(orgId, user, credentialDefinitionId, comment, connectionId, attributes);
  }

  @MessagePattern({ cmd: 'send-credential-create-offer-oob' })
  async sendCredentialOutOfBand(payload: IIssuance): Promise<string> {
    const { orgId, user, credentialDefinitionId, comment, connectionId, attributes } = payload;
    return this.issuanceService.sendCredentialOutOfBand(orgId, user, credentialDefinitionId, comment, connectionId, attributes);
  }

  @MessagePattern({ cmd: 'get-all-issued-credentials' })
  async getIssueCredentials(payload: IIssueCredentials): Promise<string> {
    const { user, threadId, connectionId, state, orgId } = payload;
    return this.issuanceService.getIssueCredentials(user, threadId, connectionId, state, orgId);
  }

  @MessagePattern({ cmd: 'get-issued-credentials-by-credentialDefinitionId' })
  async getIssueCredentialsbyCredentialRecordId(payload: IIssueCredentialsDefinitions): Promise<string> {
    const { user, credentialRecordId, orgId } = payload;
    return this.issuanceService.getIssueCredentialsbyCredentialRecordId(user, credentialRecordId, orgId);
  }
  
  @MessagePattern({ cmd: 'webhook-get-issue-credential' })
  async getIssueCredentialWebhook(payload: IIssuanceWebhookInterface): Promise<object> {
    const { createDateTime, connectionId, threadId, protocolVersion, credentialAttributes, orgId } = payload;
    return this.issuanceService.getIssueCredentialWebhook(createDateTime, connectionId, threadId, protocolVersion, credentialAttributes, orgId);
  }

  @MessagePattern({ cmd: 'out-of-band-credential-offer' })
  async outOfBandCredentialOffer(payload: OutOfBandCredentialOffer): Promise<boolean | object[]> {
    const { outOfBandCredentialDto } = payload;
    return this.issuanceService.outOfBandCredentialOffer(outOfBandCredentialDto);
  }

  @MessagePattern({ cmd: 'export-schema-to-csv-by-credDefId' })
  async exportSchemaToCSV(payload: {
    credentialDefinitionId: string
  }): Promise<object> {
    return this.issuanceService.exportSchemaToCSV(payload.credentialDefinitionId);
  }

  @MessagePattern({ cmd: 'import-and-preview-data-for-issuance' })
  async importCSV(payload: {
    importFileDetails: ImportFileDetails
  }): Promise<string> {
    this.logger.log(`payload.importFileDetails----${payload.importFileDetails}`);
    return this.issuanceService.importAndPreviewDataForIssuance(payload.importFileDetails);
  }

  @MessagePattern({ cmd: 'preview-csv-details' })
  async previewCSVDetails(payload: { requestId: string, previewFileDetails: PreviewRequest }): Promise<object> {
    return this.issuanceService.previewFileDataForIssuance(
      payload.requestId,
      payload.previewFileDetails
    );
  }

  @MessagePattern({ cmd: 'issued-file-details' })
  async issuedFiles(payload: {orgId:string, fileParameter:PreviewRequest}): Promise<object> {
    return this.issuanceService.issuedFileDetails(
      payload.orgId, 
      payload.fileParameter
      );
  }
  @MessagePattern({ cmd: 'issued-file-data' })
  async getFileDetailsByFileId(payload: {fileId:string, fileParameter:PreviewRequest}): Promise<object> {
    return this.issuanceService.getFileDetailsByFileId( 
      payload.fileId,
      payload.fileParameter
      );
  }


  @MessagePattern({ cmd: 'issue-bulk-credentials' })
  async issueBulkCredentials(payload: { requestId: string, orgId: number }): Promise<string> {
    return this.issuanceService.issueBulkCredential(payload.requestId, payload.orgId);
  }
}
