// eslint-disable-next-line camelcase
import { AutoAccept } from '@credebl/enum/enum';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { organisation } from '@prisma/client';
import { IUserRequestInterface } from 'apps/agent-service/src/interface/agent-service.interface';

export interface IAttributes {
  attributeName: string;
  name: string;
  value: string;
  isRequired?: boolean;
}
export interface IIssuance {
  user?: IUserRequest;
  credentialDefinitionId: string;
  comment?: string;
  connectionId: string;
  attributes: IAttributes[];
  orgId: string;
  autoAcceptCredential?: AutoAccept,
  protocolVersion?: string;
  goalCode?: string,
  parentThreadId?: string,
  willConfirm?: boolean,
  label?: string

}

interface IIndy {
  attributes: IAttributes[],
  credentialDefinitionId: string
}

export interface IIssueData {
  protocolVersion?: string;
  connectionId: string;
  credentialFormats: {
    indy: IIndy
  },
  autoAcceptCredential: string,
  comment?: string;
}

interface ICredentialAttribute {
  'mime-type': string;
  name: string;
  value: string;
}

export interface ICreateOfferResponse {
  _tags?: {
    connectionId: string;
    state: string;
    threadId: string;
  };
  metadata?: {
    '_anoncreds/credential'?: {
      schemaId: string;
      credentialDefinitionId: string;
    };
  };
  credentials?: unknown[];
  id: string;
  createdAt: string;
  state: string;
  connectionId: string;
  threadId: string;
  protocolVersion: string;
  credentialAttributes?: ICredentialAttribute[];
  autoAcceptCredential?: string;
  contextCorrelationId?: string;
}

export interface IIssueCredentials {
  issuedCredentialsSearchCriteria: IIssuedCredentialsSearchCriteria;
  user: IUserRequest;
  orgId: string;
}

export interface IPattern {
  cmd: string;
}

export interface ISendOfferNatsPayload {
  issueData: IIssueData,
  url: string,
  apiKey: string;
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
  schemaId: string;
  credDefId: string;
  id: string;
  state: string;
  contextCorrelationId: string;
  metadata: Metadata;
}

interface Metadata {
  '_anoncreds/credential': AnoncredsMetadata;
}

interface AnoncredsMetadata {
  schemaId?: string;
  credentialDefinitionId?: string;
}

export interface IssueCredentialWebhookPayload {
  issueCredentialDto: IIssuanceWebhookInterface;
  id: string;
}

export interface ICredentialAttributesInterface {
  'mime-type': string;
  name: string;
  value: string;
}

export interface CredentialOffer {
  emailId: string;
  attributes: IAttributes[];
}
export interface OutOfBandCredentialOfferPayload {
  credentialDefinitionId: string;
  orgId: string;
  comment?: string;
  credentialOffer?: CredentialOffer[];
  emailId?: string;
  attributes?: IAttributes[];
  protocolVersion?: string;
  goalCode?: string,
  parentThreadId?: string,
  willConfirm?: boolean,
  label?: string,
  imageUrl?: string,
  autoAcceptCredential?: string;
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
  fileKey: string;
  fileName: string;
}

export interface PreviewRequest {
  pageNumber: number,
  pageSize: number,
  searchByText: string,
  sortField: string,
  sortBy: string
}

export interface FileUpload {
  name?: string;
  upload_type?: string;
  status?: string;
  orgId?: string;
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
    jobId: string;
}

export interface IClientDetails {
  clientId: string;
  userId?: string;
  isSelectiveIssuance?: boolean;
  fileName?: string;
}
export interface IIssuedCredentialsSearchInterface {
  issuedCredentialsSearchCriteria: IIssuedCredentialsSearchCriteria;
  user: IUserRequestInterface;
  orgId: string;
}
export interface IIssuedCredentialsSearchCriteria {
  pageNumber: number;
  pageSize: number;
  sortField: string;
  sortBy: string;
  searchByText: string;
  user?: IUserRequestInterface;
}

export interface OrgAgent {
  organisation: organisation;
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentId: string;
  isDidPublic: boolean;
  ledgerId: string;
  orgAgentTypeId: string;
  tenantId: string;
}

interface IData{
  'base64': string
}

interface IRequestAttach{
  '@id': string,
  'mime-type': string,
  data: IData;
}

interface IService {
  id: string;
  serviceEndpoint: string;
  type: string;
  recipientKeys: string[];
  routingKeys: string[];
  accept: string[];
}

// This is the Interface for response of out of band issuance
export interface IOobIssuanceInvitation {
  '@type': string;
  '@id': string;
  label: string;
  accept: string[];
  handshake_protocols: string[];
  services: IService[];
  'requests~attach': IRequestAttach[]
}