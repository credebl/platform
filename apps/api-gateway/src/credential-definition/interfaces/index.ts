import { UserRoleOrgPermsDto } from '../../dtos/user-role-org-perms.dto';

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
  organisation: object;
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

export interface ICredDef {
  id: string;
  createDateTime: string;
  createdBy: string;
  lastChangedDateTime: string;
  lastChangedBy: string;
  credentialDefinitionId: string;
  tag: string;
  schemaLedgerId: string;
  schemaId: string;
  revocable: boolean;
  orgId: string;
}

export interface ICredDefs {
  credentialDefinitionId: string;
  schemaCredDefName: string;
  schemaName: string;
  schemaVersion: string;
  schemaAttributes: string; 
  credentialDefinition: string;
}

