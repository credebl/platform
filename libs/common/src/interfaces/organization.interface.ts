
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
      clientId: string,
      clientSecret: string  
  }