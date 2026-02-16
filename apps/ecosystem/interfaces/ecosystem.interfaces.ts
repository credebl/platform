import { EcosystemOrgStatus, InvitationViewRole } from '@credebl/enum/enum';
import { Prisma, PrismaClient } from '@prisma/client';

import { CommonTableColumns } from '@credebl/common/interfaces/interface';
import { JsonValue } from '@prisma/client/runtime/library';
import { OrgRoles } from 'libs/org-roles/enums';

export interface ICreateEcosystem {
  name: string;
  description: string;
  tags?: string;
  logoUrl?: string;
  userId: string;
  logo?: string;
  orgName?: string;
  orgDid?: string;
  orgId: string;
  autoEndorsement?: boolean;
  lastChangedBy?: string;
}

export interface IEcosystem {
  id: string;
  name: string;
  description: string;
  tags: string | null;
  createDateTime: Date;
  createdBy: string;
  logoUrl: string | null;
}
export interface IOrganizationData extends CommonTableColumns {
  id: string;
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
  ecosystemId: string | null;
  userId: string | null;
  createDateTime: Date;
  createdBy: string;
  organization?: IEcosystemOrg;
  invitedOrg?: string;
  orgStatus?: string;
}

export interface IEcosystemOrg {
  id: string;
  orgId: string;
  status: string;
  deploymentMode: null | string;
  ecosystemId: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  lastChangedBy: string;
  deletedAt: null | Date;
  userId: string;
}

export interface ICreateEcosystemOrg {
  orgId: string;
  status: EcosystemOrgStatus;
  ecosystemId: string;
  ecosystemRoleId: string;
  userId: string;
  createdBy: string;
  lastChangedBy: string;
}

export interface IEcosystemDetails extends CommonTableColumns {
  id: string;
  name: string;
  description: string;
  tags: string;
  deletedAt?: Date;
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

export interface IEcosystemUser {
  userId: string;
  ecosystemId: string;
  createdBy: string;
  lastChangedBy: string;
}

export interface IEcosystemMemberInvitations {
  role: InvitationViewRole;
  ecosystemId?: string;
  email?: string;
  userId?: string;
}

export interface IEcosystemSummary {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  autoEndorsement: boolean;
}

export interface IUserSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  username: string | null;
  profileImg: string | null;
}

export interface IEcosystemInvitation {
  id: string;
  email: string;
  status: string;
  type: string;
  ecosystemId: string | null;
  invitedOrg: string | null;
  createDateTime: Date;

  ecosystem: IEcosystemSummary | null;
  user: IUserSummary | null;
}

export interface IGetAllOrgs {
  id: string;
  status: string;
  userId: string | null;
  ecosystem: IGetAllOrgEcosystem;
  organisation: IGetAllOrgOrganisation;
  user: IGetAllOrgUser;
  ecosystemRole: {
    id: string;
    name: string;
  };
}

export interface IGetAllOrgEcosystem {
  id: string;
  name: string;
  description: string;
  tags: string | null;
  createDateTime: Date;
  createdBy: string;
  logoUrl: string | null;
  autoEndorsement: boolean;
  ledgers: JsonValue;
}

export interface IGetAllOrgOrganisation {
  id: string;
  createDateTime: Date;
  createdBy: string;
  name: string | null;
  description: string | null;
  orgSlug: string | null;
}

export interface IGetAllOrgUser {
  id: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  username: string | null;
}

export interface IGetEcosystemOrgStatus {
  ecosystemId: string;
  orgId: string;
  status: string;
}

export type EcosystemInvitationRoles = OrgRoles.ECOSYSTEM_LEAD | OrgRoles.ECOSYSTEM_MEMBER;

export type PrismaExecutor = Prisma.TransactionClient | PrismaClient;

export interface IPlatformDashboardCount {
  ecosystem: number;
  invitations: number;
  activeOrgs: number;
}
