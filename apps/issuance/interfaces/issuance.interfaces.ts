// eslint-disable-next-line camelcase
import { AutoAccept, SchemaType } from '@credebl/enum/enum';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { Prisma, organisation } from '@prisma/client';
import { IUserRequestInterface } from 'apps/agent-service/src/interface/agent-service.interface';
import { IssueCredentialType } from 'apps/api-gateway/src/issuance/interfaces';
import { IPrettyVc } from '@credebl/common/interfaces/issuance.interface';

export interface IAttributes {
  attributeName: string;
  name: string;
  value: string;
  isRequired?: boolean;
}

interface ICredentialsAttributes {
  connectionId: string;
  attributes: IAttributes[];
  credential?:ICredential;
  options?:IOptions
}
export interface IIssuance {
  user?: IUserRequest;
  credentialDefinitionId: string;
  comment?: string;
  credentialData: ICredentialsAttributes[];
  orgId: string;
  autoAcceptCredential?: AutoAccept,
  protocolVersion?: string;
  goalCode?: string,
  parentThreadId?: string,
  willConfirm?: boolean,
  label?: string,
  credentialType: string,
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
  apiKey?: string;
  orgId?: string;
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

export interface ICredential{
  '@context':[];
  type: string[];
  prettyVc?: IPrettyVc;
  issuer?: {
    id: string;
  };
  issuanceDate?: string;
  credentialSubject?: ICredentialSubject;
}

interface ICredentialSubject {
  [key: string]: string;
}

export interface IOptions{ 
  proofType:string;
  proofPurpose:string;
}
export interface CredentialOffer {
  emailId: string;
  attributes: IAttributes[];
  credential?:ICredential;
  options?:IOptions
}
export interface OutOfBandCredentialOfferPayload {
  credentialDefinitionId?: string;
  orgId: string;
  comment?: string;
  credentialOffer?: CredentialOffer[];
  emailId?: string;
  attributes?: IAttributes[];
  protocolVersion?: string;
  reuseConnection?: boolean;
  goalCode?: string,
  parentThreadId?: string,
  willConfirm?: boolean,
  label?: string,
  imageUrl?: string,
  autoAcceptCredential?: string;
  credentialType?:IssueCredentialType;
}

export interface OutOfBandCredentialOffer {
  user: IUserRequest;
  outOfBandCredentialDto: OutOfBandCredentialOfferPayload;
}
export interface SchemaDetails {
  credentialDefinitionId?: string;
  tag?: string;
  schemaLedgerId: string;
  attributes: string;
  name?: string;
}
export interface ImportFileDetails {
  templateId: string;
  fileKey: string;
  fileName: string;
  type: string
}
export interface ICredentialPayload {
schemaLedgerId: string,
credentialDefinitionId: string,
fileData: object,
fileName: string,
credentialType: string,
schemaName?: string
}
export interface PreviewRequest {
  pageNumber: number,
  pageSize: number,
  searchByText: string,
  sortField?: string,
  sortBy?: string
}

export interface FileUpload {
  name?: string,
  upload_type?: string,
  status?: string,
  orgId?: string,
  createDateTime?: Date | null,
  lastChangedDateTime?: Date | null,
  credentialType?: string,
  templateId?: string
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
  organizationLogoUrl?: string;
  platformName?: string;
  certificate?: string;
  size?: string;
  orientation?: string;
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
  search: string;
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

export interface SendEmailCredentialOffer {
  iterator: CredentialOffer;
  emailId: string;
  index: number;
  credentialType: IssueCredentialType; 
  protocolVersion: string;
  reuseConnection?: boolean;
  attributes: IAttributes[]; 
  credentialDefinitionId: string; 
  outOfBandCredential: OutOfBandCredentialOfferPayload;
  comment: string;
  organisation: organisation; 
  errors;
  url: string;
  orgId: string; 
  organizationDetails: organisation;
  platformName?: string,
  organizationLogoUrl?: string;
  prettyVc?: IPrettyVc;
}

export interface TemplateDetailsInterface {
  templateId?: string;
  schemaType?: SchemaType;
}
interface CredentialData {
  email_identifier: string;
  [key: string]: string;
}

export interface IJobDetails {
  id: string;
  schemaName: string;
  cacheId?: string;
  clientId?: string;
  referenceId: string | null;
  fileUploadId: string;
  schemaLedgerId: string;
  credentialDefinitionId?: string;
  status?: boolean;
  credential_data: CredentialData
  orgId: string;
  credentialType: string;
}

export interface IQueuePayload{
  id: string;
  jobId: string;
  cacheId?: string;
  clientId: string;
  referenceId: string;
  fileUploadId: string;
  schemaLedgerId: string;
  credentialDefinitionId: string;
  status: string;
  credential_data: CredentialData;
  orgId: string;
  credentialType: string;
  totalJobs: number;
  isRetry: boolean;
  isLastData: boolean;
  organizationLogoUrl?: string;
  platformName?: string;
  certificate?: string;
  size?: string;
  orientation?: string;
  reuseConnection?: boolean;
}

interface FileDetails {
  schemaLedgerId: string;
  credentialDefinitionId: string;
  fileData:object
  fileName: string;
  credentialType: string;
  schemaName: string;
}
export interface IBulkPayloadObject {
  parsedData?: unknown[],
  parsedFileDetails?: FileDetails,
  userId: string,
  fileUploadId: string
  };
export interface ISchemaAttributes {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
  isRequired: boolean;
}

export interface IIssuanceAttributes {
  [key: string]: string;
}
export interface IDeletedFileUploadRecords {
  deleteFileDetails: Prisma.BatchPayload;
  deleteFileUploadDetails: Prisma.BatchPayload;
}

export interface BulkPayloadDetails {
  clientId: string;
  orgId: string;
  requestId?: string;
  isRetry: boolean;
  organizationLogoUrl?: string;
  platformName?: string;
  certificate?: string;
  size?: string;
  orientation?: string;
}
