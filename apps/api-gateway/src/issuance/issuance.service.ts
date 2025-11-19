/* eslint-disable camelcase */
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { ClientDetails, FileParameter, IssuanceDto, OOBCredentialDtoWithEmail, OOBIssueCredentialDto, PreviewFileDetails, TemplateDetails } from './dtos/issuance.dto';
import { FileExportResponse, IIssuedCredentialSearchParams, IReqPayload, ITemplateFormat, IssueCredentialType, UploadedFileDetails } from './interfaces';
import { ICredentialOfferResponse, IDeletedIssuanceRecords, IIssuedCredential } from '@credebl/common/interfaces/issuance.interface';
import { IssueCredentialDto } from './dtos/multi-connection.dto';
import { org_agents, user } from '@prisma/client';
@Injectable()
export class IssuanceService extends BaseService {


    constructor(
        @Inject('NATS_CLIENT') private readonly issuanceProxy: ClientProxy
    ) {
        super('IssuanceService');
    }

    sendCredentialCreateOffer(issueCredentialDto: IssueCredentialDto, user: IUserRequest): Promise<ICredentialOfferResponse> {

        const payload = { comment: issueCredentialDto.comment, credentialDefinitionId: issueCredentialDto.credentialDefinitionId, credentialData: issueCredentialDto.credentialData, orgId: issueCredentialDto.orgId, protocolVersion: issueCredentialDto.protocolVersion, autoAcceptCredential: issueCredentialDto.autoAcceptCredential, credentialType: issueCredentialDto.credentialType, user };

        return this.sendNatsMessage(this.issuanceProxy, 'send-credential-create-offer', payload);
    }

    sendCredentialOutOfBand(issueCredentialDto: OOBIssueCredentialDto): Promise<{
        response: object;
    }> {
        let payload;
        if (IssueCredentialType.INDY === issueCredentialDto.credentialType) {
            payload = { attributes: issueCredentialDto.attributes, comment: issueCredentialDto.comment, credentialDefinitionId: issueCredentialDto.credentialDefinitionId, orgId: issueCredentialDto.orgId, protocolVersion: issueCredentialDto.protocolVersion, goalCode: issueCredentialDto.goalCode, parentThreadId: issueCredentialDto.parentThreadId, willConfirm: issueCredentialDto.willConfirm, label: issueCredentialDto.label, autoAcceptCredential: issueCredentialDto.autoAcceptCredential, credentialType: issueCredentialDto.credentialType, isShortenUrl: issueCredentialDto.isShortenUrl, reuseConnection : issueCredentialDto.reuseConnection };
        }
        if (IssueCredentialType.JSONLD === issueCredentialDto.credentialType) {
            payload = { credential: issueCredentialDto.credential, options: issueCredentialDto.options, comment: issueCredentialDto.comment, orgId: issueCredentialDto.orgId, protocolVersion: issueCredentialDto.protocolVersion, goalCode: issueCredentialDto.goalCode, parentThreadId: issueCredentialDto.parentThreadId, willConfirm: issueCredentialDto.willConfirm, label: issueCredentialDto.label, autoAcceptCredential: issueCredentialDto.autoAcceptCredential, credentialType: issueCredentialDto.credentialType, isShortenUrl: issueCredentialDto.isShortenUrl, reuseConnection : issueCredentialDto.reuseConnection };
        }

        return this.sendNats(this.issuanceProxy, 'send-credential-create-offer-oob', payload);
    }

    getIssueCredentials(issuedCredentialsSearchCriteria: IIssuedCredentialSearchParams, user: IUserRequest, orgId: string): Promise<IIssuedCredential> {
        const payload = { issuedCredentialsSearchCriteria, user, orgId };
        return this.sendNatsMessage(this.issuanceProxy, 'get-all-issued-credentials', payload);
    }


    getIssueCredentialsbyCredentialRecordId(user: IUserRequest, credentialRecordId: string, orgId: string): Promise<{
        response: object;
    }> {
        const payload = { user, credentialRecordId, orgId };
        return this.sendNats(this.issuanceProxy, 'get-issued-credentials-by-credentialDefinitionId', payload);
    }

    getIssueCredentialWebhook(issueCredentialDto: IssuanceDto, id: string): Promise<{response:org_agents}> {
        const payload = { issueCredentialDto, id };
        return this.sendNats(this.issuanceProxy, 'webhook-get-issue-credential', payload);
    }

    outOfBandCredentialOffer(user: IUserRequest, outOfBandCredentialDto: OOBCredentialDtoWithEmail): Promise<{
        response: object;
    }> {
        const payload = { user, outOfBandCredentialDto };
        return this.sendNats(this.issuanceProxy, 'out-of-band-credential-offer', payload);
    }

    getAllCredentialTemplates(orgId:string, schemaType:string): Promise<ITemplateFormat> {
        const payload = { orgId, schemaType};
        return this.sendNatsMessage(this.issuanceProxy, 'get-all-credential-template-for-bulk-operation', payload);
      }

    async downloadBulkIssuanceCSVTemplate(orgId: string, templateDetails: TemplateDetails
    ): Promise<FileExportResponse> {
        const payload = { orgId, templateDetails };
        return (await this.sendNats(this.issuanceProxy, 'download-csv-template-for-bulk-operation', payload)).response;
    }

    async uploadCSVTemplate(importFileDetails: UploadedFileDetails
    ): Promise<{ response: object }> {
        const payload = { importFileDetails };
        return this.sendNats(this.issuanceProxy, 'upload-csv-template', payload);
    }

    async previewCSVDetails(requestId: string,
        orgId: string,
        previewFileDetails: PreviewFileDetails
    ): Promise<string> {
        const payload = {
            requestId,
            orgId,
            previewFileDetails
        };
        return this.sendNats(this.issuanceProxy, 'preview-csv-details', payload);
    }

    async issuedFileDetails(
        orgId: string,
        fileParameter: FileParameter
    ): Promise<{ response: object }> {
        const payload = {
            orgId,
            fileParameter
        };
        return this.sendNats(this.issuanceProxy, 'issued-file-details', payload);
    }

    async getFileDetailsByFileId(
        orgId: string,
        fileId: string,
        fileParameter: FileParameter
    ): Promise<{ response: object }> {
        const payload = {
            orgId,
            fileId,
            fileParameter
        };
        return this.sendNats(this.issuanceProxy, 'issued-file-data', payload);
    }

    async issueBulkCredential(requestId: string, orgId: string, clientDetails: ClientDetails, reqPayload: IReqPayload): Promise<object> {
        const payload = { requestId, orgId, clientDetails, reqPayload };
        return this.sendNatsMessage(this.issuanceProxy, 'issue-bulk-credentials', payload);
    }

    async retryBulkCredential(fileId: string, orgId: string, clientDetails: ClientDetails): Promise<object> {
        const payload = { fileId, orgId, clientDetails };
        return this.sendNatsMessage(this.issuanceProxy, 'retry-bulk-credentials', payload);
    }

    async _getWebhookUrl(tenantId?: string, orgId?: string): Promise<string> {
        const pattern = { cmd: 'get-webhookurl' };
        const payload = { tenantId, orgId };

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const message = await this.issuanceProxy.send<any>(pattern, payload).toPromise();
            return message;
        } catch (error) {
            this.logger.error(`catch: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async _postWebhookResponse(webhookUrl: string, data: object): Promise<string> {
        const pattern = { cmd: 'post-webhook-response-to-webhook-url' };
        const payload = { webhookUrl, data };

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const message = await this.issuanceProxy.send<any>(pattern, payload).toPromise();
            return message;
        } catch (error) {
            this.logger.error(`catch: ${JSON.stringify(error)}`);

            throw error;
        }
    }

    async deleteIssuanceRecords(orgId: string, userDetails: user): Promise<IDeletedIssuanceRecords> {
        const payload = { orgId, userDetails };
        return this.sendNatsMessage(this.issuanceProxy, 'delete-issuance-records', payload);
    }

}
