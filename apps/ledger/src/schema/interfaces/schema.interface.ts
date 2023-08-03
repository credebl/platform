import { UserRoleOrgPermsDto } from '../dtos/user-role-org-perms.dto';

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