import { Prisma } from '@prisma/client';
export interface AttributeValue {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
}

export interface IW3CSchemaAttributesVAlue {
  title: string;
  type: string;
}

export interface IRequestSchemaEndorsement {
  orgId: string;
  userId?: string;
  name: string;
  version: string;
  attributes: AttributeValue[];
  endorse?: boolean;
}

export interface IRequestW3CSchemaEndorsement {
  orgId: string;
  userId?: string;
  schemaName: string;
  did: string;
  schemaAttributes: IW3CSchemaAttributesVAlue[];
  description: string;
  endorse?: boolean;
}

export interface RequestCredDeffEndorsement {
  schemaId: string;
  tag: string;
  endorse?: boolean;
  schemaDetails?: object;
  userId?: string;
}

export interface IAttributeValue {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
}

export interface SchemaTransactionPayload {
  endorserDid: string;
  endorse: boolean;
  attributes: string[];
  version: string;
  name: string;
  issuerId: string;
}

export interface CredDefTransactionPayload {
  endorserDid: string;
  endorse: boolean;
  tag: string;
  schemaId: string;
  issuerId: string;
}

export interface SchemaMessage {
  message?: {
    jobId: string;
    schemaState: {
      state: string;
      action: string;
      schemaId: string;
      schema: Record<string, unknown>;
      schemaRequest: string;
    };
    registrationMetadata: Record<string, unknown>;
    schemaMetadata: Record<string, unknown>;
  };
}

export interface CredDefMessage {
  message?: {
    jobId: string;
    credentialDefinitionState: {
      state: string;
      action: string;
      schemaId: string;
      schema: Record<string, unknown>;
      credentialDefinitionRequest: string;
      credentialDefinition: Record<string, unknown>;
    };
    registrationMetadata: Record<string, unknown>;
    schemaMetadata: Record<string, unknown>;
  };
}
export interface SchemaTransactionResponse {
  endorserDid: string;
  authorDid: string;
  requestPayload: string;
  status: string;
  ecosystemOrgId: string;
  userId?: string;
}

export interface SignedTransactionMessage {
  message?: {
    signedTransaction: string;
  };
}

export interface IEndorsementTransaction {
  id: string;
  endorserDid: string;
  authorDid: string;
  status: string;
  ecosystemOrgId: string;
  createDateTime: Date;
  createdBy: string;
  type?: string;
}

interface SchemaPayload {
  attributes: string[];
  version: string;
  name: string;
  issuerId: string;
}

interface CredentialDefinitionPayload {
  tag: string;
  issuerId: string;
  schemaId: string;
  type: string;
  value: Record<string, unknown>;
}

export interface submitTransactionPayload {
  endorsedTransaction: string;
  endorserDid: string;
  schema?: SchemaPayload;
  credentialDefinition?: CredentialDefinitionPayload;
}

export interface SaveSchema {
  name: string;
  version: string;
  attributes: string;
  schemaLedgerId: string;
  issuerId: string;
  createdBy: string;
  lastChangedBy: string;
  publisherDid: string;
  orgId: string;
  ledgerId: string;
  type?: string;
}

export interface saveCredDef {
  schemaLedgerId: string;
  tag: string;
  credentialDefinitionId: string;
  revocable: boolean;
  createdBy: string;
  lastChangedBy: string;
  orgId: string;
  schemaId: string;
}

export interface EndorsementTransactionPayloadDetails {
  id: string;
  endorserDid: string;
  authorDid: string;
  requestPayload: string;
  responsePayload: string;
  type: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: Date | null;
  status: string;
  ecosystemOrgId: string;
  requestBody: unknown;
  ecosystemOrgs?: {
    orgId: string;
  };
}

export interface CreateEcosystem {
  name?: string;
  description?: string;
  tags?: string;
  logoUrl?: string;
  userId?: string;
  logo?: string;
  orgName?: string;
  orgDid?: string;
  orgId?: string;
  autoEndorsement?: boolean;
  lastChangedBy?: string;
  ledgers?: string[];
}

export interface OrganizationData {
  id: string;
  createDateTime: string;
  createdBy: string;
  lastChangedDateTime: string;
  lastChangedBy: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  org_agents: OrgAgent[];
}

export interface OrgAgent {
  id: string;
  orgDid: string;
  verkey: string;
  agentEndPoint: string;
  isDidPublic: boolean;
  agentSpinUpStatus: number;
  walletName: string;
  tenantId: string;
  agentsTypeId: string;
  orgId: string;
  orgAgentTypeId: string;
  ledgerId?: string;
  ledgers?: LedgerDetails;
}

export interface LedgerDetails {
  id: string;
  name: string;
  indyNamespace: string;
  networkUrl: string;
}

export interface EcosystemInvitationDetails {
  name: string;
  id: string;
  logoUrl: string;
  description?: string;
  tags?: string;
  createDateTime?: Date;
  createdBy?: string;
  lastChangedDateTime?: Date;
  lastChangedBy?: string;
  deletedAt?: Date;
  autoEndorsement?: boolean;
  ledgers: Prisma.JsonValue;
  networkDetails?: LedgerDetails[];
}

export interface InvitationResponse {
  id: string;
  email: string;
  status: string;
  ecosystemId: string;
  userId: string;
  orgId: string;
  deletedAt: Date;
  ecosystem: EcosystemInvitationDetails;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
}

export interface IEcosystemInvitation {
  invitations: InvitationResponse[];
  totalPages: number;
}

export interface TransactionPayload {
  endorsementId: string;
  ecosystemId: string;
  ecosystemLeadAgentEndPoint?: string;
  orgId?: string;
}

export interface IEcosystemDashboard {
  ecosystem: IEcosystemDetails[];
  membersCount: number;
  endorsementsCount: number;
  ecosystemLead: EcosystemLeadDetails;
};

interface IEcosystemDetails {
  id: string;
  name: string;
  description: string;
  tags: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: Date;
  logoUrl: string;
  autoEndorsement: boolean;
  ledgers: string[];
}

interface EcosystemLeadDetails {
  role: string;
  orgName: string;
  config: IEcosystemConfigDetails[];
}
interface IEcosystemConfigDetails {
  id: string;
  key: string;
  value: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: Date;
}

export interface IEditEcosystem extends IEcosystem {
  lastChangedDateTime: Date;
  lastChangedBy: string;
}

export interface IEcosystem {
  id: string;
  name: string;
  description: string;
  tags: string;
  createDateTime: Date;
  createdBy: string;
  logoUrl: string;
  autoEndorsement: boolean;
  ledgers: Prisma.JsonValue;
}

export interface IEcosystemInvitations {
  id: string;
  email: string;
  status: string;
  ecosystemId: string;
  userId: string;
  orgId: string;
  ecosystem: EcosystemInvitationDetails;
  createDateTime: Date;
  createdBy: string;
}

interface IAttributes {
  isRequired: boolean;
  displayName: string;
  attributeName: string;
  schemaDataType: string;
}

interface ISChemaItems {
  id: string;
  createDateTime: string;
  createdBy: string;
  lastChangedDateTime: string;
  lastChangedBy: string;
  name: string;
  version: string;
  attributes: IAttributes[];
  schemaLedgerId: string;
  publisherDid: string;
  issuerId: string;
  orgId: string;
  ledgerId: string;
}

export interface ISchemaResponse {
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  lastPage: number;
  data: ISChemaItems[];
}

export interface IEcosystemList { 
  orgId: string,
  pageNumber: number;
  pageSize: number;
  search: string;
}

export interface IEcosystemLeadOrgs {
  organizationIds: string[];
  ecosystemId: string;
  orgId: string;
  userId: string;
}

export interface IEcosystemOrgs {
  orgId: string,
  ecosystemId: string,
  ecosystemRoleId: string,
  status: string,
  deploymentMode: string,
  createdBy: string,
  lastChangedBy: string
}
export interface IEcosystemOrgsData extends IEcosystemOrgs {
  id: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  deletedAt: Date;
}

export interface IEcosystemOrgDetails {
  count: Prisma.BatchPayload;
  ecosystemOrgs: IEcosystemOrgsData[];
}


export interface IEcosystemEndorsementFlag {
  autoEndorsement: boolean;
}