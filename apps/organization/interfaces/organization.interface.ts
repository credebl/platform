export interface IUserOrgRoles {
  id: string
  userId: string
  orgRoleId: string
  orgId: string | null,
  orgRole: IOrgRole
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
  agent_invitations: IAgentInvitation[];
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
}