import { Prisma } from '@prisma/client';

export interface IUserOrgRoles {
  id: string
  userId: string
  orgRoleId: string
  orgId: string | null,
  orgRole: IOrgRole
}

export interface IClientCredentials {
  clientId: string;
  clientSecret: string;
}

export interface IUpdateOrganization {
  name: string;
  description?: string;
  orgId: string;
  logo?: string;
  website?: string;
  orgSlug?: string;
  isPublic?:boolean;
  userId?: string;

}

export interface ICreateConnectionUrl {
  id: string;
  orgId: string;
  agentId: string;
  connectionInvitation: string;
  multiUse: boolean;
  createDateTime: Date;
  createdBy: number;
  lastChangedDateTime: Date;
  lastChangedBy: number;
}

export interface IOrgAgent {
  url: string;
  apiKey: string;
}


export interface IGetOrgById { 
  id: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  schema: ISchema[];
  org_agents: IOrgAgents[];
}

interface ISchema {
  id: string;
  name: string;
}

interface IOrgAgents {
  agent_invitations?: IAgentInvitation[];
  ledgers: ILedgers;
  org_agent_type: IOrgAgentType;
}

interface IAgentInvitation {
  id: string;
  connectionInvitation: string;
  multiUse: boolean;
}

export interface IUserOrgRole {
  user: string;
  orgRole: string;
}

interface IOrgAgentType {
  id: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  agent: string;
}

interface ILedgers {
  id: string;
  name: string;
  networkType: string
}

export interface IGetOrganization {
  totalCount:number;
  totalPages:number;
  organizations : IGetAllOrganizations[];
}

interface IGetAllOrganizations{
  id: string,
  name: string,
  description: string,
  logoUrl: string,
  orgSlug: string,
  userOrgRoles: IUserOrganizationRoles[];
}

interface IUserOrganizationRoles {
  id: string,
  orgRole :IOrgRole;
}

export interface IOrgRole {
  id: string
  name: string
  description: string
}

export interface IOrgInvitationsPagination {
  totalPages: number;
  invitations: IInvitation[];
}

interface IInvitation {
  id: string,
  orgId: string,
  email: string,
  userId: string,
  status: string,
  orgRoles: string[],
  createDateTime: Date,
  createdBy:string,
  organisation: IOrganizationPagination;
}

interface IOrganizationPagination {
  id: string;
  name: string;
  logoUrl: string;
}

export interface Payload {
  pageNumber: number;
  pageSize: number;
  search: string;
  role?: string;
}

export interface IDidList {
  id: string;
  createDateTime: Date;
  did: string;
  lastChangedDateTime: Date;
  isPrimaryDid: boolean;
}

export interface IPrimaryDid {
  orgId: string,
  did: string
}

export interface IDidDetails {
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

export interface IPrimaryDidDetails extends IPrimaryDid {
  id: string
  networkId: string
  didDocument: Prisma.JsonValue
}

export interface OrgInvitation {
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: Date;
  userId: string;
  orgId: string;
  status: string;
  orgRoles: string[];
  email: string;
}

export interface ILedgerNameSpace {
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

export interface IGetDids {
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

export interface ILedgerDetails {
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

export interface IOrgRoleDetails {
  id: string;
  name: string;
  description: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: Date;
}

export interface IVerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58: string;
}