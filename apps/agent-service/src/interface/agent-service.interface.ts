import { AgentSpinUpStatus } from '@credebl/enum/enum';
import { Prisma } from '@prisma/client';
import { UserRoleOrgPermsDto } from 'apps/api-gateway/src/dtos/user-role-org-perms.dto';

export interface IAgentSpinupDto {
  walletName: string;
  walletPassword: string;
  seed: string;
  orgId?: string;
  orgName?: string;
  ledgerId?: string[];
  keyType: string;
  domain?: string;
  privatekey?: string;
  endpoint?: string;
  role?: string;
  network?: string;
  endorserDid?: string;
  method: string;
  did?: string;
  agentType?: string;
  transactionApproval?: boolean;
  clientSocketId?: string;
  tenant?: boolean;
  ledgerName?: string[];
  platformAdminEmail?: string;
  isOnPremises?: boolean;
  agentEndpoint?: string;
  apiKey?: string;
  orgAgentType?: string;
  userId?: string;
}

export interface IAgentConfigure {
  walletName: string;
  did: string;
  agentEndpoint: string;
  apiKey: string;
  orgId: string;
  network?: string;
}

export interface IOutOfBandCredentialOffer {
  emailId: string;
  attributes: IAttributes[];
  credentialDefinitionId: string;
  comment: string;
  protocolVersion?: string;
  orgId: string;
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
  label?: string;
}

export interface ITenantDto {
  label: string;
  seed?: string;
  keyType: string;
  ledgerId: string[];
  domain?: string;
  privatekey?: string;
  endpoint?: string;
  role?: string;
  network?: string;
  endorserDid?: string;
  method: string;
  orgId: string;
  did?: string;
  tenantId?: string;
  didDocument?: string;
  clientSocketId?: string;
}

export interface IWallet {
  label: string;
  orgId: string;
  did?: string;
  clientSocketId?: string;
}

export interface IDidCreate {
  keyType: string;
  seed: string;
  domain?: string;
  network?: string;
  privatekey?: string;
  endpoint?: string;
  method: string;
  did?: string;
  role?: string;
  endorserDid?: string;
  isPrimaryDid?: boolean;
}
export interface ITenantSchema {
  tenantId?: string;
  attributes: string[];
  version: string;
  name: string;
  issuerId?: string;
  payload?: ITenantSchemaDto;
  method?: string;
  agentType?: string;
  apiKey?: string;
  agentEndPoint?: string;
  orgId?: string;
}

export interface ITenantSchemaDto {
  attributes: string[];
  version: string;
  name: string;
  issuerId: string;
}

export interface IGetSchemaAgentRedirection {
  schemaId?: string;
  tenantId?: string;
  payload?: IGetSchemaFromTenantPayload;
  apiKey?: string;
  agentEndPoint?: string;
  agentType?: string;
  method?: string;
  orgId?: string;
}

export interface IGetSchemaFromTenantPayload {
  schemaId: string;
}

export interface ITenantCredDef {
  tenantId?: string;
  tag?: string;
  schemaId?: string;
  issuerId?: string;
  payload?: ITenantCredDef;
  method?: string;
  agentType?: string;
  apiKey?: string;
  agentEndPoint?: string;
  orgId?: string;
}

export interface IWalletProvision {
  orgId: string;
  externalIp: string;
  walletName: string;
  walletPassword: string;
  seed: string;
  webhookEndpoint: string;
  walletStorageHost: string;
  walletStoragePort: string;
  walletStorageUser: string;
  walletStoragePassword: string;
  containerName: string;
  agentType: string;
  orgName: string;
  indyLedger: string;
  credoImage: string;
  protocol: string;
  tenant: boolean;
  inboundEndpoint: string;
  apiKey?: string;
}

export interface IPlatformConfigDto {
  externalIP: string;
  genesisURL: string;
  adminKey: string;
  lastInternalIP: string;
  platformTestNetApiKey: string;
  sgEmailFrom: string;
  apiEndpoint: string;
  tailsFileServer: string;
}

export interface IStoreOrgAgentDetails {
  id?: string;
  clientSocketId?: string;
  agentEndPoint?: string;
  apiKey?: string;
  seed?: string;
  keyType?: string;
  method?: string;
  network?: string;
  role?: string;
  did?: string;
  didDoc?: string;
  verkey?: string;
  isDidPublic?: boolean;
  agentSpinUpStatus?: number;
  walletName?: string;
  agentsTypeId?: string;
  orgId?: string;
  agentId?: string;
  orgAgentTypeId?: string;
  tenantId?: string;
  ledgerId?: string[];
  agentType?: string;
  userId?: string;
}

export interface IStoreDidDetails {
  orgId: string;
  isPrimaryDid?: boolean;
  did: string;
  didDocument?: string;
  userId: string;
  orgAgentId: string;
}

export interface IStoreOrgAgent {
  id?: string;
  clientSocketId?: string;
  agentEndPoint?: string;
  apiKey?: string;
  seed?: string;
  did?: string;
  verkey?: string;
  isDidPublic?: boolean;
  agentSpinUpStatus?: number;
  walletName?: string;
  agentsTypeId?: string;
  orgId?: string;
  agentId?: string;
  orgAgentTypeId?: string;
  tenantId?: string;
  ledgerId?: unknown;
  agentType?: string;
}

export interface IConnectionDetails {
  multiUseInvitation?: boolean;
  autoAcceptConnection: boolean;
}

export interface IUserRequestInterface {
  userId?: string;
  id?: string;
  email: string;
  orgId: string;
  agentEndPoint?: string;
  apiKey?: string;
  tenantId?: string;
  tenantName?: string;
  tenantOrgId?: string;
  userRoleOrgPermissions?: UserRoleOrgPermsDto[];
  orgName?: string;
  selectedOrg: IOrgInterface;
}

export interface IOrgInterface {
  id: string;
  userId: string;
  orgRoleId: string;
  orgId: string;
  orgRole: object;
  organisation: IOrganizationAgentInterface;
}

export interface IOrganizationAgentInterface {
  name: string;
  description: string;
  org_agents: IOrgAgentInterface[];
}

export interface IPlatformAgent {
  seed: string;
  keyType: string;
  method: string;
  network: string;
  role: string;
}

export interface IOrgAgentInterface {
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  agentOptions: string;
  walletName: string;
  agentsTypeId: string;
  orgId: string;
}

export interface ITenantCredDefDto {
  tag: string;
  schemaId: string;
  issuerId: string;
}

export interface IGetCredDefAgentRedirection {
  credentialDefinitionId?: string;
  tenantId?: string;
  payload?: IGetCredDefFromTenantPayload;
  apiKey?: string;
  agentEndPoint?: string;
  agentType?: string;
  method?: string;
  orgId?: string;
}

export interface IGetCredDefFromTenantPayload {
  credentialDefinitionId: string;
}

export interface IIssuanceCreateOffer {
  connectionId: string;
  credentialFormats: ICredentialFormats;
  autoAcceptCredential: string;
  comment: string;
}

export interface ICredentialFormats {
  indy: IIndy;
  credentialDefinitionId: string;
}

export interface IIndy {
  attributes: IAttributes[];
}

export interface IAttributes {
  name: string;
  value: string;
}
export interface ISendProofRequestPayload {
  comment: string;
  connectionId?: string;
  proofFormats: IProofFormats;
  autoAcceptProof: string;
  goalCode?: string;
  parentThreadId?: string;
  willConfirm?: boolean;
  protocolVersion?: string;
}

export interface IAgentStatus {
  label: string;
  endpoints: string[];
  isInitialized: boolean;
}

export interface ISchema {
  uri: string;
}

export interface IFilter {
  type: string;
  pattern: string;
}
export interface IFields {
  path: string[];
  filter: IFilter;
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
  purpose: string;
  input_descriptors: IInputDescriptors[];
}

export interface IPresentationExchange {
  presentationDefinition: IProofRequestPresentationDefinition;
}

interface IProofFormats {
  indy?: IndyProof;
  presentationExchange?: IPresentationExchange;
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
  name: string;
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
}

export interface IAgentSpinUpSatus {
  agentSpinupStatus: number;
}

interface IWalletConfig {
  id: string;
  key: string;
  keyDerivationMethod: string;
}

interface IConfig {
  label: string;
  walletConfig: IWalletConfig;
}
export interface ITenantRecord {
  _tags: string;
  metadata: string;
  id: string;
  createdAt: string;
  config: IConfig;
  updatedAt: string;
}

export interface ICreateTenant {
  tenantRecord: ITenantRecord;
  did: string;
  verkey: string;
}

export interface IOrgAgent {
  agentSpinUpStatus: number;
}

export interface IOrgLedgers {
  id: string;
}

export interface ICreateOrgAgent {
  id: string;
}

interface IOrgAgentEndPoint {
  agentSpinUpStatus: number;
  agentEndPoint: string;
  apiKey;
}

export interface IOrgAgentsResponse {
  org_agents: IOrgAgentEndPoint[];
}
export interface IStoreAgent {
  id: string;
}

export interface IAcceptCredentials {
  credentialRecordId: string;
}
export interface IAgentProofRequest {
  metadata: object;
  id: string;
  createdAt: string;
  protocolVersion: string;
  state: string;
  connectionId: string;
  threadId: string;
  autoAcceptProof: string;
  updatedAt: string;
}

export interface IPresentation {
  _tags: ITags;
  metadata: object;
  id: string;
}
export interface IStoreAgent {
  id: string;
}

export interface IReceiveInvite {
  alias?: string;
  label?: string;
  imageUrl?: string;
  autoAcceptConnection?: boolean;
  autoAcceptInvitation?: boolean;
  reuseConnection?: boolean;
  acceptInvitationTimeoutMs?: number;
}

export interface IReceiveInvitationUrl extends IReceiveInvite {
  invitationUrl: string;
}

interface IService {
  id: string;
  serviceEndpoint: string;
  type: string;
  recipientKeys: string[];
  routingKeys: string[];
  accept: string[];
}

interface IInvitation {
  '@id': string;
  '@type': string;
  label: string;
  goalCode: string;
  goal: string;
  accept: string[];
  handshake_protocols: string[];
  services: (IService | string)[];
  imageUrl?: string;
}

export interface IReceiveInvitation extends IReceiveInvite {
  invitation: IInvitation;
}
export interface IProofPresentation {
  createdAt: string;
  protocolVersion: string;
  state: string;
  connectionId: string;
  threadId: string;
  autoAcceptProof: string;
  updatedAt: string;
  isVerified: boolean;
}

interface ITags {
  connectionId: string;
  state: string;
  threadId: string;
}

export interface IValidResponses {
  text: string;
}
export interface IQuestionPayload {
  detail: string;
  validResponses: IValidResponses[];
  question: string;
  orgId?: string;
  connectionId: string;
  tenantId: string;
}
export interface IBasicMessage {
  content: string;
}
interface Ledger {
  id: string;
  createDateTime: string;
  lastChangedDateTime: string;
  name: string;
  networkType: string;
  poolConfig: string;
  isActive: boolean;
  networkString: string;
  nymTxnEndpoint: string;
  indyNamespace: string;
  networkUrl: string | null;
}

export interface LedgerListResponse {
  response: Ledger[];
}

export interface ICreateConnectionInvitation {
  label?: string;
  alias?: string;
  imageUrl?: string;
  goalCode?: string;
  goal?: string;
  handshake?: boolean;
  handshakeProtocols?: object[];
  messages?: object[];
  multiUseInvitation?: boolean;
  autoAcceptConnection?: boolean;
  routing?: object;
  appendedAttachments?: object[];
  orgId?: string;
}

export interface AgentHealthData {
  label: string;
  endpoints: string[];
  isInitialized: boolean;
}

export interface IAgentStore {
  did?: string;
  verkey?: string;
  isDidPublic?: boolean;
  agentSpinUpStatus?: AgentSpinUpStatus;
  walletName?: string;
  agentsTypeId?: string;
  orgId?: string;
  agentEndPoint?: string;
  agentId?: string;
  orgAgentTypeId?: string;
  ledgerId?: string[];
  id?: string;
  apiKey?: string;
  userId?: string;
  createdBy?: string;
  lastChangedBy?: string;
  didDoc?: string;
  tenantId?: string;
}

export interface LedgerNameSpace {
  id: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  name: string;
  networkType: string;
  poolConfig: string;
  isActive: boolean;
  networkString: string;
  nymTxnEndpoint: string;
  indyNamespace: string;
  networkUrl: string;
}

export interface OrgDid {
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  orgId: string;
  isPrimaryDid: boolean;
  did: string;
  didDocument: Prisma.JsonValue;
  orgAgentId: string;
}

export interface ILedgers {
    id: string;
    createDateTime: Date;
    lastChangedDateTime: Date;
    name: string;
    networkType: string;
    poolConfig: string;
    isActive: boolean;
    networkString: string;
    nymTxnEndpoint: string;
    indyNamespace: string;
    networkUrl: string;

}
