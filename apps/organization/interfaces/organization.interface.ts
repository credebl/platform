export interface IUserOrgRoles {
  id: string
  userId: string
  orgRoleId: string
  orgId: string | null,
  orgRole: OrgRole
}

export interface OrgRole {
  id: string
  name: string
  description: string
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

export interface RegisterOnPremAgent {

  ledgerId?: string[];
  orgId?: string;
  userId?: string;
  did: string;
  agentEndpoint?: string;
  token?: string;
}

export interface OrgAgentDetails {
  id?: string;
  clientSocketId?: string;
  agentEndPoint?: string;
  apiKey?: string;
  seed?: string;
  did?: string;
  verkey?: string;
  isDidPublic?: boolean;
  agentSpinUpStatus?: number;
  walletName?: string;
  agentsTypeId?: string;
  orgId?: string;
  agentId?: string;
  orgAgentTypeId?: string;
  tenantId?: string;
  ledgerId?: string[];
  agentType?: string;
}
