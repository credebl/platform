import { AgentType, OrgAgentType } from '@credebl/enum/enum';
import { UserRoleOrgPermsDto } from 'apps/api-gateway/src/dtos/user-role-org-perms.dto';

export interface IAgentSpinupDto {

    walletName: string;
    walletPassword: string;
    seed: string;
    orgId: string;
    ledgerId?: string[];
    agentType?: AgentType;
    transactionApproval?: boolean;
    clientSocketId?: string
    tenant?: boolean;
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
    agentType: AgentType;
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
    orgId?: string;
    agentId?: string;
    orgAgentTypeId?: OrgAgentType;
    tenantId?: string;
    ledgerId?: string[];
}


export interface IConnectionDetails {
    multiUseInvitation?: boolean;
    autoAcceptConnection: boolean;
}

export interface IUserRequestInterface {
    userId: string;
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