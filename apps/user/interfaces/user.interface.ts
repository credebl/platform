export  interface UserInvitations {
  totalPages:number;
  userInvitationsData:UserInvitationsData[];
}
export  interface UserInvitationsData {
  orgRoles: OrgRole[];
  status: string;
  id: string;
  orgId: string;
  organisation: Organisation;
  userId: string;
}
export interface OrgRole {
  id: string;
  name: string;
  description: string;
}

export interface Organisation {
  id: string;
  name: string;
  logoUrl: string;
}

export interface UsersProfile {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  supabaseUserId?: string;
  userOrgRoles?: UserOrgRole[];
}

interface UserOrgRole {
  id:  string;
  userId:  string;
  orgRoleId:  string;
  orgId:  string;
  orgRole: {
    id:  string;
    name: string;
    description: string;
  };
  organisation: {
    id:  string;
    name: string;
    description: string;
    orgSlug: string;
    logoUrl: string;
    website: string;
    publicProfile: boolean;
  };
}
  
  export interface OrgInvitations {
    id: string;
    userId: string;
    orgId?: string;
    organisation?: object;
    orgRoleId?: string;
    status: string;
    email?: string;
    orgRoles: string[];
  }
  
  export interface UserEmailVerificationDto {
    email: string;
    username?: string;
  }
  
  export interface UserInfo {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isPasskey: boolean;
  }
  
  export interface AddPasskeyDetails {
    password: string;
  }

  export interface UpdateUserProfile {
    id: string;
    profileImg?: string;
    firstName: string;
    lastName: string;
    isPublic: boolean;
  }
  export interface PlatformSettings {
    externalIp: string;
    lastInternalId: string;
    sgApiKey: string;
    emailFrom: string;
    apiEndPoint: string;
    enableEcosystem: boolean;
    multiEcosystemSupport: boolean;
  }
  
  export interface ShareUserCertificate {
    schemaId: string;
    credentialId: string;
    attributes: Attribute[];
  }
  
  export interface Attribute {
    [key: string]: string;
    label: string;
  }
  
  export interface CheckUserDetails {
    isEmailVerified?: boolean;
    isFidoVerified?: boolean;
    isSupabase?: boolean;
    isExist?: boolean;
  }

  export interface UserCredentials {
    id: string;
    imageUrl?: string;
    credentialId?: string;
    createDateTime: Date;
    lastChangedDateTime: Date;
    deletedAt: Date;
  }

  export interface IOrgUsers {
    totalPages: number,
    users: OrgUser[]
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
    organisation: Organization
  }

  interface Organization {
    id: string,
    name: string,
    description: string,
    orgSlug: string,
    logoUrl: string,
    org_agents: OrgAgents[];
  }

  interface OrgAgents {
    id: string,
    orgDid: string,
    walletName: string,
    agentSpinUpStatus: number,
    agentsTypeId: string,
    createDateTime: Date,
    orgAgentTypeId:string
  }

  export interface Payload {
    pageNumber: number;
    pageSize: number;
    search: string;
  }
