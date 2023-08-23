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
    orgId: number;
    protocolVersion: string;
}

export interface IIssueCredentials {
    user: IUserRequest;
    connectionId: string;
    threadId: string;
    orgId: number;
    state: string;
}

export interface IIssueCredentialsDefinitions {
    user: IUserRequest;
    credentialRecordId: string;
    orgId: number;
}

export interface IIssuanceWebhookInterface {
    createDateTime: string;
    connectionId: string;
    threadId: string;
    protocolVersion: string;
    credentialAttributes: ICredentialAttributesInterface[];
    orgId: number;
}

export interface ICredentialAttributesInterface {
    'mime-type': string;
    name: string;
    value: string;
}

export interface OutOfBandCredentialOfferPayload {
    emailId: string;
    attributes: IAttributes[];
    credentialDefinitionId: string;
    comment: string;
    protocolVersion?: string;
    orgId: number;
}

export interface OutOfBandCredentialOffer {
    user: IUserRequest;
    outOfBandCredential: OutOfBandCredentialOfferPayload;
}