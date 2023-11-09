/* eslint-disable camelcase */
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IssuanceDto, IssueCredentialDto, OutOfBandCredentialDto } from './dtos/issuance.dto';

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
       
        const payload = { attributes: issueCredentialDto.attributes, comment: issueCredentialDto.comment, credentialDefinitionId: issueCredentialDto.credentialDefinitionId, connectionId: issueCredentialDto.connectionId, orgId: issueCredentialDto.orgId, protocolVersion: issueCredentialDto.protocolVersion, user };
    
        return this.sendNats(this.issuanceProxy, 'send-credential-create-offer', payload);
    }

    sendCredentialOutOfBand(issueCredentialDto: IssueCredentialDto, user: IUserRequest): Promise<{
        response: object;
    }> {
        const payload = { attributes: issueCredentialDto.attributes, comment: issueCredentialDto.comment, credentialDefinitionId: issueCredentialDto.credentialDefinitionId, connectionId: issueCredentialDto.connectionId, orgId: issueCredentialDto.orgId, user };
        return this.sendNats(this.issuanceProxy, 'send-credential-create-offer-oob', payload);
    }
    
    getIssueCredentials(issuedCredentialsSearchCriteria: IIssuedCredentialSearchinterface, user: IUserRequest, orgId: string): Promise<{
        response: object;
    }> {
        const payload = { issuedCredentialsSearchCriteria, user, orgId };
        return this.sendNats(this.issuanceProxy, 'get-all-issued-credentials', payload);
    }


    getIssueCredentialsbyCredentialRecordId(user: IUserRequest, credentialRecordId: string, orgId: string): Promise<{
        response: object;
    }> {
        const payload = { user, credentialRecordId, orgId };
        return this.sendNats(this.issuanceProxy, 'get-issued-credentials-by-credentialDefinitionId', payload);
    }

    getIssueCredentialWebhook(issueCredentialDto: IssuanceDto, id: number): Promise<{
        response: object;
    }> {
        const payload = { issueCredentialDto, id };
        return this.sendNats(this.issuanceProxy, 'webhook-get-issue-credential', payload);
    }

    outOfBandCredentialOffer(user: IUserRequest, outOfBandCredentialDto: OutOfBandCredentialDto): Promise<{
        response: object;
    }> {
        const payload = { user, outOfBandCredentialDto };
        return this.sendNats(this.issuanceProxy, 'out-of-band-credential-offer', payload);
    }

}
