export interface IUserOrgRoles {
  id: string
  userId: string
  orgRoleId: string
  orgId: string | null,
  orgRole: OrgRole
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

export interface OrgAgent {
  url: string;
  apiKey: string;
}

export interface Org_Role {
  id: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  schema: Schema[];
  org_agents: OrgAgents;
  userOrgRoles: UserOrgRole;
}

export interface GetOrgById {
  id: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  schema: Schema[];
  org_agents: OrgAgents[];
}

interface Schema {
  id: string;
  name: string;
}

interface OrgAgents {
  agent_invitations: AgentInvitation[];
  ledgers: Ledgers;
  org_agent_type: Org_agent_type;
}

interface AgentInvitation {
  id: string;
  connectionInvitation: string;
  multiUse: boolean;
}

export interface UserOrgRole {
  user: string;
  orgRole: string;
}

interface Org_agent_type {
  id: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  agent: string;
}

interface Ledgers {
  id: string;
  name: string;
  networkType: string
}

export interface GetOrgs {
  totalPages:number;
  organizations : AllOrganizations[];
}

interface AllOrganizations {
  id: string,
  name: string,
  description: string,
  logoUrl: string,
  orgSlug: string,
  userOrgRoles: UserOrgRoles[];
}

interface UserOrgRoles {
  id: string,
  orgRole :OrgRole;
}

export interface OrgRole {
  id: string
  name: string
  description: string
}

export interface OrgInvitationsPagination {
  totalPages: number;
  invitations: Invitation[];
}

interface Invitation {
  id: string,
  orgId: string,
  email: string,
  userId: string,
  status: string,
  orgRoles: string[],
  createDateTime: Date,
  createdBy:string,
  organisation: OrganizationPagination;
}

interface OrganizationPagination {
  id: string;
  name: string;
  logoUrl: string;
}

export interface OrganizationDashboard {
  usersCount: number,
  schemasCount: number,
  credentialsCount: number,
  presentationsCount:number
}