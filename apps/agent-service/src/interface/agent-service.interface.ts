import { UserRoleOrgPermsDto } from 'apps/api-gateway/src/dtos/user-role-org-perms.dto';

export interface IAgentSpinupDto {

    walletName: string;
    walletPassword: string;
    seed: string;
    orgId?: string;
    orgName?: string;
    ledgerId?: string[];
    did?: string;
    agentType?: string;
    transactionApproval?: boolean;
    clientSocketId?: string
    tenant?: boolean;
    ledgerName?: string[];
    platformAdminEmail?: string;
}

export interface OutOfBandCredentialOffer {
    emailId: string;
    attributes: Attributes[];
    credentialDefinitionId: string;
    comment: string;
    protocolVersion?: string;
    orgId: string;
}

export interface ITenantDto {
    label: string;
    seed: string;
    ledgerId?: string[];
    method: string;
    orgId: string;
    tenantId?: string;
    clientSocketId?: string;
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
}

export interface ITenantSchemaDto {
    attributes: string[];
    version: string;
    name: string;
    issuerId: string;
}

export interface GetSchemaAgentRedirection {
    schemaId?: string;
    tenantId?: string;
    payload?: GetSchemaFromTenantPayload;
    apiKey?: string;
    agentEndPoint?: string;
    agentType?: string;
    method?: string;
}

export interface GetSchemaFromTenantPayload {
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
}

export interface ITenantCredDefDto {
    tag: string;
    schemaId: string;
    issuerId: string;
}

export interface GetCredDefAgentRedirection {
    credentialDefinitionId?: string;
    tenantId?: string;
    payload?: GetCredDefFromTenantPayload;
    apiKey?: string;
    agentEndPoint?: string;
    agentType?: string;
    method?: string;
}

export interface GetCredDefFromTenantPayload {
    credentialDefinitionId: string;
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
    internalIp: string;
    containerName: string;
    agentType: string;
    orgName: string;
    indyLedger: string;
    afjVersion: string;
    protocol: string;
    tenant: boolean;
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
    ledgerId?: string[];
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
    selectedOrg: ISelectedOrgInterface;
}

export interface ISelectedOrgInterface {
    id: string;
    userId: string;
    orgRoleId: string;
    orgId: string;
    orgRole: object;
    organisation: IOrganizationInterface;
}

export interface IOrganizationInterface {
    name: string;
    description: string;
    org_agents: IOrgAgentInterface[]

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
}

export interface ITenantCredDefDto {
    tag: string;
    schemaId: string;
    issuerId: string;
}

export interface GetCredDefAgentRedirection {
    credentialDefinitionId?: string;
    tenantId?: string;
    payload?: GetCredDefFromTenantPayload;
    apiKey?: string;
    agentEndPoint?: string;
    agentType?: string;
    method?: string;
}

export interface GetCredDefFromTenantPayload {
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
    attributes: Attributes[];
}

export interface Attributes {
    name: string;
    value: string;
}
export interface ISendProofRequestPayload {
    comment: string;
    connectionId?: string;
    proofFormats: IProofFormats;
    autoAcceptProof: string;
}

export interface AgentStatus {
    label: string;
    endpoints: string[];
    isInitialized: boolean;
}

interface IProofFormats {
    indy: IndyProof
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
    restrictions: IRequestedRestriction[]
}

interface IRequestedPredicates {
    [key: string]: IRequestedPredicatesName;
}

interface IRequestedPredicatesName {
    name: string;
    restrictions: IRequestedRestriction[]
}

interface IRequestedRestriction {
    cred_def_id: string;
}

export interface AgentSpinUpSatus {
    agentSpinupStatus: number;
}

interface WalletConfig {
    id: string;
    key: string;
    keyDerivationMethod: string;
  }
  
  interface Config {
    label: string;
    walletConfig: WalletConfig;
  }
  
  interface TenantRecord {
    _tags: string;
    metadata: string;
    id: string;
    createdAt: string;
    config: Config;
    updatedAt: string;
  }
  
  export interface CreateTenant {
    tenantRecord: TenantRecord;
    did: string;
    verkey: string;
  }
  
