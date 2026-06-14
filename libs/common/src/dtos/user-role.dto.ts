export class UserRoleDto {
  id: string;
  name: string;
  permissions: string[];
}

export class UserOrgDto {
  id: string;
  orgName: string;
}

export class UserRoleOrgPermsDto {
  id: string;
  role: UserRoleDto;
  Organization: UserOrgDto;
}
