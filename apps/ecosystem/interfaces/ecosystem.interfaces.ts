export interface ICreateEcosystem {
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
}

export interface IEcosystem {
  id: string;
  name: string;
  description: string;
  tags: string;
  createDateTime: Date;
  createdBy: string;
  logoUrl: string;
}
export interface IOrganizationData {
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

export interface IEcosystemInvitations {
  id: string;
  email: string;
  status: string;
  ecosystemId?: string;
  userId: string | null;
  createDateTime: Date;
  createdBy: string;
}

export interface IEcosystemDetails {
  id: string;
  name: string;
  description: string;
  tags: string;
  createDateTime: Date;
  createdBy: string;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: Date | null;
  logoUrl: string;
}

export interface IEcosystemDashboard {
  ecosystem: IEcosystemDetails[];
  membersCount: number;
  endorsementsCount: number;
  ecosystemLead: {
    role: string | null;
    orgName: string | null;
  } | null;
}
