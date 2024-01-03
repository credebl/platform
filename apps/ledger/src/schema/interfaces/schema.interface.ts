import { UserRoleOrgPermsDto } from '../dtos/user-role-org-perms.dto';

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

export interface AgentDetails {
    orgDid: string;
    agentEndPoint: string;
    tenantId: string
}

export interface ISchemaData {
  createDateTime: Date;
  createdBy: string;
  name: string;
  version: string;
  attributes: string;
  schemaLedgerId: string;
  publisherDid: string;
  issuerId: string;
  orgId: string;
  ledgerId?: string;
  id?: string;
}

export interface ISchemasWithCount {
  schemasCount: number;
  schemasResult: ISchemaData[];
}
