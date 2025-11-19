import { CloudWalletType } from '@credebl/enum/enum';
import { $Enums } from '@prisma/client';
import { JsonValue, SingleOrArray } from 'apps/api-gateway/src/issuance/utils/helper';

export class ICreateCloudWallet {
    label: string;
    connectionImageUrl?: string;
    email?: string;
    userId?: string;
  }

  export class IDeleteCloudWallet {
    email?: string;
    userId?: string;
    deleteHolder: boolean;
  }

export interface ICloudWalletDetails {
    label: string;
    tenantId: string;
    email?: string;
    type: CloudWalletType;
    createdBy: string;
    lastChangedBy: string;
    userId: string;
    agentEndpoint?: string;
    agentApiKey?: string;
    key?: string;
    connectionImageUrl?: string;
  }

export interface IStoredWalletDetails {
  email: string,
  connectionImageUrl: string,
  createDateTime: Date,
  id: string,
  tenantId: string,
  label: string,
  lastChangedDateTime: Date
}

export interface IReceiveInvitation {
  alias?: string;
  label?: string;
  imageUrl?: string;
  autoAcceptConnection?: boolean;
  autoAcceptInvitation?: boolean;
  reuseConnection?: boolean;
  acceptInvitationTimeoutMs?: number;
  ourDid?: string;
  invitationUrl: string;
  email?: string;
  userId?: string;
  connectionType?: string;
}

export interface IAcceptOffer {
  autoAcceptCredential?: string;
  comment?: string;
  credentialRecordId: string;
  credentialFormats?: object;
  email?: string;
  userId?: string;
}

export interface ICreateCloudWalletDid {
  seed?: string;
  keyType: string;
  method: string;
  network?: string;
  domain?: string;
  role?: string;
  privatekey?: string;
  endpoint?: string;
  did?: string;
  endorserDid?: string;
  email?: string;
  userId?: string;
  isDefault?: boolean;
}
export interface IGetStoredWalletInfo {
  email: string;
  userId: string;
  id: string;
  type: $Enums.CloudWalletType;
  agentEndpoint: string;
}

export interface IConfigureCloudBaseWallet {
  email: string;
  walletKey: string;
  apiKey: string;
  agentEndpoint: string;
}

export interface IConfigureCloudBaseWalletPayload {
  cloudBaseWalletConfigure: IConfigureCloudBaseWallet;
  userId: string;
}

export interface IStoreWalletInfo {
  email: string;
  key: string;
  agentApiKey: string;
  agentEndpoint: string;
  type: CloudWalletType;
  userId?: string;
  createdBy: string; 
  lastChangedBy: string,
  maxSubWallets: number
}

export interface IGetStoredWalletInfo {
  email: string;
  userId: string;
  id: string;
  type: $Enums.CloudWalletType;
  agentEndpoint: string;
}

export interface IAcceptProofRequest {
  proofRecordId: string;
  userId: string;
  email: string;
  filterByPresentationPreview?: boolean;
  filterByNonRevocationRequirements?: boolean;
  comment?: string;
}

export interface ICheckCloudWalletStatus {
  userId: string;
  email: string;
}

export interface IDeclineProofRequest {
  proofRecordId: string;
  userId: string;
  email: string;
  sendProblemReport?: boolean;
  problemReportDescription?: string;
}
export interface IAcceptProofRequestPayload {
  acceptProofRequest: IAcceptProofRequest;
  userId: string;
}

export interface IProofByProofId {
  proofId: string;
  userId: string;
}

export interface IProofPresentation {
  threadId: string;
  userId: string;
}

export interface IGetProofPresentationById {
  userId: string;
  email: string;
  proofRecordId: string;
}

export interface IProofPresentationPayloadWithCred {
  userId: string;
  email: string;
  proof: {
    proofFormats: {
      presentationExchange: {
        credentials: Record<string, string>;
      }
    },
    comment?: string,
    proofRecordId: string;
  } 
}

export interface IGetCredentialsForRequest {
  userId: string;
  email: string;
  proofRecordId: string;
}

export interface IGetProofPresentation {
  userId: string;
  email: string;
  threadId: string;
}

export interface ICloudBaseWalletConfigure {
  walletKey: string;
  apiKey: string;
  agentEndpoint: string;
  maxSubWallets: number;
  userId: string;
  email: string;
  // webhookUrl: string;
  // orgId: string;
}

export interface Tags {
  connectionId: string;
  role: string;
  state: string;
  threadId: string;
}

export interface IProofRequestRes {
  _tags: Tags;
  metadata: unknown;
  id: string;
  createdAt: string;
  protocolVersion: string;
  state: string;
  role: string;
  connectionId: string;
  threadId: string;
  updatedAt: string;
}

export interface CloudWallet {
  id: string;
  label: string;
  tenantId: string;
  email: string;
  type: $Enums.CloudWalletType;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  userId: string;
  agentEndpoint: string;
  agentApiKey: string;
  key: string;
  connectionImageUrl: string;
}

export interface IWalletDetailsForDidList {
  userId: string;
  email: string;
  isDefault: boolean
}

export interface IConnectionDetailsById {
  userId: string;
  email: string;
  connectionId: string;
}

export interface ITenantDetail {
  userId?: string;
  email?: string;
  threadId?: string;
  connectionId?: string;
  state?: string;
}

export interface ICredentialDetails {
  userId: string;
  email: string;
  credentialRecordId: string;
}

export interface IProofPresentationDetails {
  userId: string;
  email: string;
  proofRecordId: string;
}
export interface Thread {
  pthid: string;
  thid: string;
}

export interface Message {
  '@type': string;
  '@id': string;
  '~thread': Thread;
  messageType: string;
}

export interface Data {
  base64?: string;
  json?: string;
  links?: string[];
  jws?: {
    header: object;
    signature: string;
    protected: string;
  };
  sha256?: string;
}

export interface AppendedAttachment {
  id: string;
  description: string;
  filename: string;
  mimeType: string;
  lastmodTime: string;
  byteCount: number;
  data: Data;
}

export interface ICreateConnection {
  label: string;
  alias: string;
  imageUrl: string;
  multiUseInvitation: boolean;
  autoAcceptConnection: boolean;
  goalCode: string;
  goal: string;
  handshake: boolean;
  handshakeProtocols: string[];
  messages: Message[];
  appendedAttachments: AppendedAttachment[];
  invitationDid: string;
  recipientKey: string;
  userId: string;
  email: string;
}

export interface Invitation {
  '@type': string;
  '@id': string;
  label: string;
  accept: string[];
  handshake_protocols: string[];
  services: Service[];
}

export interface Service {
  id: string;
  type: string;
  priority: number;
  recipientKeys: string[];
  routingKeys: string[];
  serviceEndpoint: string;
}

export interface OutOfBandRecord {
  _tags: Tags;
  metadata: Record<string, object>;
  id: string;
  createdAt: string;
  outOfBandInvitation: Invitation;
  role: string;
  state: string;
  alias: string;
  autoAcceptConnection: boolean;
  reusable: boolean;
  updatedAt: string;
}

export interface Tags {
  recipientKeyFingerprints: string[];
}

export interface IConnectionInvitationResponse {
  invitationUrl: string;
  invitation: Invitation;
  outOfBandRecord: OutOfBandRecord;
  invitationDid: string;
}

export interface GetAllCloudWalletConnections {
  outOfBandId?: string;
  alias?: string;
  myDid?: string;
  theirDid?: string;
  theirLabel?: string;
  email?: string;
  userId?: string;
}

export interface IBasicMessage {
  userId: string;
  email: string;
  connectionId: string;
}

export interface IBasicMessageDetails {
  userId?: string;
  email?: string;
  content: string;
  connectionId: string
}


export interface ICredentialForRequestRes {
  proofFormats: ProofFormats;
}

interface ProofFormats {
  presentationExchange: PresentationExchange;
}

interface PresentationExchange {
  requirements:             Requirement[];
  areRequirementsSatisfied: boolean;
  name:                     string;
  purpose:                  string;
}

interface Requirement {
  rule:                   string;
  needsCount:             number;
  submissionEntry:        SubmissionEntry[];
  isRequirementSatisfied: boolean;
}

interface SubmissionEntry {
  inputDescriptorId:     string;
  verifiableCredentials: VerifiableCredential[];
}

interface VerifiableCredential {
  type:             object;
  credentialRecord: CredentialRecord;
}

interface CredentialRecord {
  _tags:      ITags;
  metadata:   object;
  id:         string;
  createdAt:  Date;
  credential: Credential;
  updatedAt:  Date;
}

interface ITags {
  claimFormat:   object;
  contexts:      string[];
  expandedTypes: string[];
  issuerId:      string;
  proofTypes:    string[];
  subjectIds:    string[];
  types:         string[];
}


interface Credential {
  '@context':        string[];
  type:              string[];
  issuer:            Issuer;
  issuanceDate:      Date;
  credentialSubject: object;
  proof:             Proof;
}


interface Issuer {
  id: string;
}

interface Proof {
  verificationMethod: string;
  type:               string;
  created:            Date;
  proofPurpose:       string;
  jws:                string;
}

export interface BaseAgentInfo {
  agentEndpoint: string;
  useCount: number;
  maxSubWallets: number;
}
interface JsonObject {
    [property: string]: JsonValue
}

export interface ISelfAttestedCredential {
  '@context': Array<string | JsonObject>;

  type: string[];

  credentialSubject: SingleOrArray<JsonObject>;
  [key: string]: unknown;

  proofType: string;

  userId: string;
  email: string;
}

export interface IW3cCredentials {
  userId: string;
  email: string;
  credentialRecordId?: string;
}

export interface IExportCloudWallet {
  passKey: string;
  walletID: string;
  userId: string;
  email: string;
}

export interface IAddConnectionType {
  connectionType: string;
  connectionId: string;
  userId: string;
  email: string;
}