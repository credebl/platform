import { AutoAccept } from '@credebl/enum/enum';
import { IUserRequest } from '@credebl/user-request/user-request.interface';

export interface IProofRequestAttribute {
  attributeName?: string;
  attributeNames?: string[];
  condition?: string;
  value?: string;
  credDefId?: string;
  schemaId?: string;
  credentialName?: string;
}

export enum ProofRequestType {
  INDY = 'indy',
  PRESENTATIONEXCHANGE = 'presentationExchange'
}

export interface IRequestProof {
  orgId: string;
  version: string;
  connectionId?: string | string[];
  attributes?: IProofRequestAttribute[];
  type: ProofRequestType;
  presentationDefinition?: IProofRequestPresentationDefinition;
  comment: string;
  autoAcceptProof: AutoAccept;
  protocolVersion?: string;
  emailId?: string[];
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
}

export interface IGetAllProofPresentations {
  url: string;
  apiKey: string;
}

export interface IGetProofPresentationById {
  url: string;
  apiKey?: string;
  orgId?: string;
}

export interface IVerifyPresentation {
  url: string;
  apiKey?: string;
  orgId?: string;
}

export interface IVerifiedProofData {
  url: string;
  apiKey?: string;
  orgId?: string;
}

export interface IProofPresentationData {
  proofId: string;
  orgId: string;
  user: IUserRequest;
}

interface IProofFormats {
  indy: IndyProof;
}

interface IndyProof {
  name: string;
  version: string;
  requested_attributes: IRequestedAttributes;
  requested_predicates: IRequestedPredicates;
}

interface IRequestedAttributes {
  [key: string]: IRequestedAttributesName;
}

interface IRequestedAttributesName {
  name?: string;
  names?: string;
  restrictions: IRequestedRestriction[];
}

interface IRequestedPredicates {
  [key: string]: IRequestedPredicatesName;
}

interface IRequestedPredicatesName {
  name: string;
  restrictions: IRequestedRestriction[];
}

interface IRequestedRestriction {
  cred_def_id?: string;
  schema_id?: string;
  schema_issuer_did?: string;
  schema_name?: string;
  issuer_did?: string;
  schema_version?: string;
}
export interface ISchema {
  uri: string;
}
export interface IFields {
  path: string[];
}
export interface IConstraints {
  fields: IFields[];
}

export interface IInputDescriptors {
  id: string;
  name?: string;
  purpose?: string;
  schema: ISchema[];
  constraints?: IConstraints;
}

export interface IProofRequestPresentationDefinition {
  id: string;
  name: string;
  purpose?: string;
  input_descriptors: IInputDescriptors[];
}

export interface IPresentationExchange {
  presentationDefinition: IProofRequestPresentationDefinition;
}
export interface IPresentationExchangeProofFormats {
  presentationExchange?: IPresentationExchange;
  indy?: IndyProof;
}
export interface ISendPresentationExchangeProofRequestPayload {
  protocolVersion: string;
  comment: string;
  parentThreadId?: string;
  proofFormats: IPresentationExchangeProofFormats;
  autoAcceptProof: string;
  label?: string;
}
export interface IPresentationExchangeProofRequestPayload {
  url: string;
  apiKey?: string;
  proofRequestPayload: ISendPresentationExchangeProofRequestPayload;
  orgId?: string;
}

export interface ISendProofRequestPayload {
  protocolVersion?: string;
  comment?: string;
  connectionId?: string;
  proofFormats?: IProofFormats;
  autoAcceptProof?: AutoAccept;
  label?: string;
  goalCode?: string;
  // TODO: [Credo-ts] Issue with parentThreadId in creating an OOB proof request.
  // This causes failures in OOB connection establishment.
  // parentThreadId?: string;
  willConfirm?: boolean;
  imageUrl?: string;
  emailId?: string[];
  isShortenUrl?: boolean;
  type?: string;
  orgId?: string;
  presentationDefinition?: IProofRequestPresentationDefinition;
  reuseConnection?: boolean;
  recipientKey?: string;
  invitationDid?: string;
}

export interface IWSendProofRequestPayload {
  protocolVersion?: string;
  comment?: string;
  connectionId?: string;
  proofFormats?: IProofFormats;
  autoAcceptProof?: string;
  label?: string;
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
  imageUrl?: string;
  emailId?: string[];
  type?: string;
  presentationDefinition?: IProofRequestPresentationDefinition;
}

export interface IProofRequestPayload {
  url: string;
  apiKey?: string;
  orgId?: string;
  proofRequestPayload: ISendProofRequestPayload | ISendPresentationExchangeProofRequestPayload;
}

interface IWebhookPresentationProof {
  threadId: string;
  state: string;
  connectionId;
}

export interface IWebhookProofPresentation {
  metadata: object;
  _tags: IWebhookPresentationProof;
  id: string;
  createdAt: string;
  protocolVersion: string;
  state: string;
  connectionId: string;
  presentationId: string;
  threadId: string;
  parentThreadId?: string;
  autoAcceptProof: string;
  updatedAt: string;
  isVerified: boolean;
  contextCorrelationId: string;
  errorMessage?: string;
}

export interface IProofPresentation {
  proofPresentationPayload: IWebhookProofPresentation;
  orgId: string;
}

export interface IProofRequests {
  proofRequestsSearchCriteria: IProofRequestSearchCriteria;
  user: IUserRequest;
  orgId: string;
}

export interface IProofRequestSearchCriteria {
  pageNumber: number;
  pageSize: number;
  sortField: string;
  sortBy: string;
  search: string;
}

export interface IInvitation {
  outOfBandRecord?: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & Record<string, any>;
  proofRecordThId?: string;
  invitationUrl?: string;
  deepLinkURL?: string;
}

export interface IProofRequestData {
  goalCode?: string;
  version: string;
  parentThreadId?: string;
  willConfirm?: boolean;
  protocolVersion?: string;
  proofFormats?: IProofFormat;
  orgId: string;
  connectionId?: string | string[];
  attributes?: IProofRequestAttribute[];
  type: ProofRequestType;
  presentationDefinition?: IProofRequestPresentationDefinition;
  comment: string;
  autoAcceptProof: AutoAccept;
}
export interface IProofFormat {
  indy: Indy;
}

export interface Indy {
  attributes: IProofAttributesData[];
}

export interface IProofAttributesData {
  attributeName: string;
  attributeNames?: string[];
  condition: string;
  value: string;
  credDefId: string;
  schemaId: string;
}

export interface IEmailResponse {
  email: string;
  isEmailSent: boolean;
  outOfBandRecordId: string;
  proofRecordThId: string;
}

export enum ProofRequest {
  presentationReceived = 'presentation-received',
  offerReceived = 'offer-received',
  declined = 'decliend',
  requestSent = 'request-sent',
  requestReceived = 'request-received',
  credentialIssued = 'credential-issued',
  credentialReceived = 'credential-received',
  done = 'done',
  abandoned = 'abandoned'
}

export enum ProofRequestState {
  requestSent = 'Requested',
  requestReceived = 'Received',
  done = 'Verified',
  abandoned = 'Declined',
  presentationReceived = 'Presentation Received'
}
