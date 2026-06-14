import { CommonTableColumns } from '@credebl/common/interfaces/interface';
import { InvitationViewRole } from '@credebl/common/enum/enum';

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

export interface IEcosystem {
  id: string;
  name: string;
  description: string;
  tags: string | null;
  createDateTime: Date;
  createdBy: string;
  logoUrl: string | null;
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

export interface IEcosystemDetails extends CommonTableColumns {
  id: string;
  name: string;
  description: string;
  tags: string;
  deletedAt?: Date;
  logoUrl: string;
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
  user?: IUserSummary | null;
  organisation: {
    name: string | null;
  } | null;
}

export interface IEcosystemSummary {
  id: string;
  name: string;
  description: string | null;
  logoUrl?: string | null;
  autoEndorsement?: boolean;
}

export interface IUserSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  username: string | null;
  profileImg: string | null;
}

export interface IEcosystemMemberInvitations {
  role: InvitationViewRole;
  ecosystemId?: string;
  email?: string;
  userId?: string;
}

export interface IGetAllOrgs {
  id: string;
  status: string;
  ecosystem: IGetAllOrgEcosystem;
  organisation: IGetAllOrgOrganisation;
  createDateTime: Date;
  user: IGetAllOrgUser;
}

export interface IGetAllOrgEcosystem {
  id: string;
  name: string;
}

export interface IGetAllOrgOrganisation {
  id: string;
  name: string | null;
}

export interface IGetAllOrgUser {
  id: string;
  email: string | null;
}

export interface IPlatformDashboardCount {
  ecosystem: number;
  invitations: number;
  activeOrgs: number;
}
