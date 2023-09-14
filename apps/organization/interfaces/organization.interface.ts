export interface IUserOrgRoles {
  id: number
  userId: number
  orgRoleId: number
  orgId: number | null,
  orgRole: OrgRole
}

export interface OrgRole {
  id: number
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
  isPublic?:boolean
}