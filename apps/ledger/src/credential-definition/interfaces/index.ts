import { UserRoleOrgPermsDto } from '../../schema/dtos/user-role-org-perms.dto';

export interface IUserRequestInterface {
  id: string;
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

export interface ISchemaResponse{
  name: string;
  version: string;
  attributes: string;
  schemaLedgerId: string;
  orgId: string;
  createDateTime?: Date; 
  createdBy?: string;
  organisation?: Organisation;
}

interface UserDetails {
  firstName: string;
}

interface UserOrgRole {
  user: UserDetails;
}

interface Organisation {
  name: string;
  userOrgRoles: UserOrgRole[];
}