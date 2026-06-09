export interface IOrgUsers {
  totalPages: number;
  users: OrgUser[];
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
  organisation: Organization;
}

interface OrgRole {
  id: string;
  name: string;
  description: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
}
