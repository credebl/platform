// eslint-disable-next-line camelcase
import { IUserRequest } from '@credebl/user-request/user-request.interface';


export interface Attributes {
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

export interface CredentialOffer {
    emailId: string;
    attributes: Attributes[];
}
export interface OutOfBandCredentialOfferPayload {
    credentialDefinitionId: string;
    orgId: string;
    comment?: string;
    credentialOffer?: CredentialOffer[];
    emailId?: string;
    attributes?: Attributes[];
    protocolVersion?: string;
}

export interface OutOfBandCredentialOffer {
    user: IUserRequest;
    outOfBandCredentialDto: OutOfBandCredentialOfferPayload;
}
export interface SchemaDetails {
    credentialDefinitionId: string;
    tag: string;
    schemaLedgerId: string;
    attributes: string;
}
export interface ImportFileDetails {
    credDefId: string;
    filePath: string;
    fileName: string;
}

export interface PreviewRequest {
    pageNumber: number,
    search: string,
    pageSize: number,
    sortBy: string,
    sortValue: string
}

export interface FileUpload {
    name?: string;
    upload_type?: string;
    status?: string;
    orgId?: number | string;
    createDateTime?: Date;
    lastChangedDateTime?: Date;
  }

export interface FileUploadData {
    fileUpload: string;
    fileRow: string;
    isError: boolean;
    referenceId: string;
    createDateTime: Date;
    error?: string;
    detailError?: string;
}