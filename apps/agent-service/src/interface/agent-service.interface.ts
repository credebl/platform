import { AgentType, OrgAgentType } from '@credebl/enum/enum';
import { UserRoleOrgPermsDto } from 'apps/api-gateway/src/dtos/user-role-org-perms.dto';

export interface IAgentSpinupDto {

    walletName: string;
    walletPassword: string;
    seed: string;
    orgId: number;
    agentType?: AgentType;
    ledgerId?: number;
    transactionApproval?: boolean;
    clientSocketId?: string
    tenant?: boolean;
}

export interface OutOfBandCredentialOffer {
    emailId: string;
    attributes: IAttributes[];
    credentialDefinitionId: string;
    comment: string;
    protocolVersion?: string;
    orgId: number;
}

export interface ITenantDto {
    label: string;
    seed: string;
    tenantId?: string;
    orgId: number;
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
    agentType?: number;
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
    agentType?: number;
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
    agentType?: number;
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
    agentType?: number;
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
    agentType: AgentType;
    orgName: string;
    genesisUrl: string;
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
    clientSocketId?: string;
    agentEndPoint?: string;
    apiKey?: string;
    seed?: string;
    did?: string;
    verkey?: string;
    isDidPublic?: boolean;
    agentSpinUpStatus?: number;
    walletName?: string;
    agentsTypeId?: AgentType;
    orgId?: number;
    agentId?: number;
    orgAgentTypeId?: OrgAgentType;
    tenantId?: string;
}


export interface IConnectionDetails {
    multiUseInvitation?: boolean;
    autoAcceptConnection: boolean;
}

export interface IUserRequestInterface {
    userId: number;
    email: string;
    orgId: number;
    agentEndPoint?: string;
    apiKey?: string;
    tenantId?: number;
    tenantName?: string;
    tenantOrgId?: number;
    userRoleOrgPermissions?: UserRoleOrgPermsDto[];
    orgName?: string;
    selectedOrg: ISelectedOrgInterface;
}

export interface ISelectedOrgInterface {
    id: number;
    userId: number;
    orgRoleId: number;
    orgId: number;
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
    agentType?: number;
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
    agentType?: number;
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
    attributes: IAttributes[];
}

export interface IAttributes {
    name: string;
    value: string;
}
export interface ISendProofRequestPayload {
    comment: string;
    connectionId: string;
    proofFormats: IProofFormats;
    autoAcceptProof: string;
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