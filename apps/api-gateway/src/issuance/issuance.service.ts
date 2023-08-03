import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IssuanceDto, IssueCredentialDto } from './dtos/issuance.dto';

@Injectable()
export class IssuanceService extends BaseService {


    constructor(
        @Inject('NATS_CLIENT') private readonly issuanceProxy: ClientProxy
    ) {
        super('IssuanceService');
    }

    sendCredentialCreateOffer(issueCredentialDto: IssueCredentialDto, user: IUserRequest): Promise<{
        response: object;
    }> {
        const payload = { attributes: issueCredentialDto.attributes, comment: issueCredentialDto.comment, credentialDefinitionId: issueCredentialDto.credentialDefinitionId, connectionId: issueCredentialDto.connectionId, orgId: issueCredentialDto.orgId, user };
        return this.sendNats(this.issuanceProxy, 'send-credential-create-offer', payload);
    }

    sendCredentialOutOfBand(issueCredentialDto: IssueCredentialDto, user: IUserRequest): Promise<{
        response: object;
    }> {
        const payload = { attributes: issueCredentialDto.attributes, comment: issueCredentialDto.comment, credentialDefinitionId: issueCredentialDto.credentialDefinitionId, connectionId: issueCredentialDto.connectionId, orgId: issueCredentialDto.orgId, user };
        return this.sendNats(this.issuanceProxy, 'send-credential-create-offer-oob', payload);
    }


    getIssueCredentials(user: IUserRequest, threadId: string, connectionId: string, state: string, orgId: number): Promise<{
        response: object;
    }> {
        const payload = { user, threadId, connectionId, state, orgId };
        return this.sendNats(this.issuanceProxy, 'get-all-issued-credentials', payload);
    }

    getIssueCredentialsbyCredentialRecordId(user: IUserRequest, credentialRecordId: string, orgId: number): Promise<{
        response: object;
    }> {
        const payload = { user, credentialRecordId, orgId };
        return this.sendNats(this.issuanceProxy, 'get-issued-credentials-by-credentialDefinitionId', payload);
    }

    getIssueCredentialWebhook(issueCredentialDto: IssuanceDto, id: number): Promise<{
        response: object;
    }> {
        const payload = { createDateTime: issueCredentialDto.createdAt, connectionId: issueCredentialDto.connectionId, threadId: issueCredentialDto.threadId, protocolVersion: issueCredentialDto.protocolVersion, credentialAttributes: issueCredentialDto.credentialAttributes, orgId: id };
        return this.sendNats(this.issuanceProxy, 'webhook-get-issue-credential', payload);
    }

}
