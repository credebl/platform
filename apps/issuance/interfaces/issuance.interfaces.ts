// eslint-disable-next-line camelcase
import { IUserRequest } from '@credebl/user-request/user-request.interface';


export interface IAttributes {
    name: string;
    value: string;
}
export interface IIssuance {
    user: IUserRequest;
    credentialDefinitionId: string;
    comment: string;
    connectionId: string;
    attributes: IAttributes[];
    orgId: string;
    protocolVersion: string;
}

export interface IIssueCredentials {
    user: IUserRequest;
    connectionId: string;
    threadId: string;
    orgId: string;
    state: string;
}

export interface IIssueCredentialsDefinitions {
    user: IUserRequest;
    credentialRecordId: string;
    orgId: string;
}

export interface IIssuanceWebhookInterface {
    createDateTime: string;
    connectionId: string;
    threadId: string;
    protocolVersion: string;
    credentialAttributes: ICredentialAttributesInterface[];
    orgId: string;
}
 
export interface ICredentialAttributesInterface {
    'mime-type': string;
    name: string;
    value: string;
}
