export interface IOrganization {
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  userOrgRoles: UserOrgRole[];
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

interface IGetAllOrganizations {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  orgSlug: string;
  userOrgRoles: IUserOrganizationRoles[];
}
export interface IGetOrganization {
  totalCount: number;
  totalPages: number;
  organizations: IGetAllOrganizations[];
}

interface IUserOrganizationRoles {
  id: string;
  orgRole: IOrgRole;
}

export interface IOrgUsers {
  totalPages: number;
  users: OrgUser[];
}

interface OrgUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  userOrgRoles: UserOrgRoles[];
}

interface UserOrgRoles {
  id: string;
  orgId: string;
  orgRoleId: string;
  orgRole: OrgRole;
  organisation: Organization;
}

interface OrgRole {
  id: string;
  name: string;
  description: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  org_agents: OrgAgents[];
}

interface OrgAgents {
  id: string;
  orgDid: string;
  walletName: string;
  agentSpinUpStatus: number;
  agentsTypeId: string;
  createDateTime: Date;
  orgAgentTypeId: string;
}

export interface IOrgRole {
  id: string;
  name: string;
  description: string;
}

interface ILedgers {
  id: string;
  name: string;
  networkType: string;
}
interface IOrgAgentType {
  id: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  agent: string;
}
export interface IUserOrgRole {
  user: string;
  orgRole: string;
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

export interface IDidList {
  id: string;
  createDateTime: Date;
  did: string;
  lastChangedDateTime: Date;
  isPrimaryDid: boolean;
}

export interface UserOrgRole {
  id: string;
  userId: string;
  orgRoleId: string;
  orgId: string;
  user: User;
  orgRole: IOrgRoles;
}

export interface User {
  email: string;
  username: string;
  id: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
}

export interface IOrgRoles {
  id: string;
  name: string;
  description: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
}

export interface IOrgCredentials {
  idpId?: string;
  clientId: string;
  clientSecret: string;
}
export interface IOrganizationDashboard {
  usersCount: number;
  schemasCount: number;
  credentialsCount: number;
  presentationsCount: number;
}

export interface IOrganizationInvitations {
  totalPages: number;
  invitations: IOrgInvitation[];
}

interface IOrgInvitation {
  id: string;
  orgId: string;
  email: string;
  userId: string;
  status: string;
  orgRoles: string[];
  createDateTime: Date;
  createdBy: string;
  organisation: IOrganizations;
}

interface IOrganizations {
  id: string;
  name: string;
  logoUrl: string;
}

export interface IDeleteOrganization {
  id: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  name: string;
  description: string;
  orgSlug: string;
  logoUrl: string;
  website: string;
  publicProfile: boolean;
  idpId: string;
  clientId: string;
  clientSecret: string;
}

export interface IOrgData extends IDeleteOrganization {
  registrationNumber: string;
  country: string;
  city: string;
  state: string;
}

export interface IOrgActivityCount {
  verificationRecordsCount: number;
  issuanceRecordsCount: number;
  connectionRecordsCount: number;
  orgUsersCount: number;
  orgInvitationsCount: number;
}
