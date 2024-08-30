
export interface IOrganization {
    id: string
    createDateTime: Date
    createdBy: string
    lastChangedDateTime: Date
    lastChangedBy: string
    name: string
    description: string
    orgSlug: string
    logoUrl: string
    website: string
    publicProfile: boolean
    userOrgRoles: UserOrgRole[]
  }
  
  export interface UserOrgRole {
    id: string
    userId: string
    orgRoleId: string
    orgId: string
    user: User
    orgRole: IOrgRoles
  }
  
  export interface User {
    email: string
    username: string
    id: string
    firstName: string
    lastName: string
    isEmailVerified: boolean
  }
  
  export interface IOrgRoles {
    id: string
    name: string
    description: string
    createDateTime: Date
    createdBy: string
    lastChangedDateTime: Date
    lastChangedBy: string
  }

export interface IOrgCredentials {
  idpId?: string,
  clientId: string,
  clientSecret: string
}
export interface IOrganizationDashboard {
  usersCount: number,
  schemasCount: number,
  credentialsCount: number,
  presentationsCount: number
}

  export interface IOrganizationInvitations {
    totalPages: number;
    invitations: IOrgInvitation[];
  }
  
  interface IOrgInvitation {
    id: string,
    orgId: string,
    email: string,
    userId: string,
    status: string,
    orgRoles: string[],
    createDateTime: Date,
    createdBy:string,
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

  export interface IOrgData extends IDeleteOrganization{
    registrationNumber: string,
    country: string,
    city: string,
    state: string
  }
  
  export interface IOrgActivityCount {
    verificationRecordsCount: number;
    issuanceRecordsCount: number;
    connectionRecordsCount: number;
    orgUsersCount: number;
    orgEcosystemsCount: number;
    orgInvitationsCount: number;
  }
  