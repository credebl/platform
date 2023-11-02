
export class UserRoleOrgPermsDto {
    id?: string;
    role?: userRoleDto;
    organization?: userOrgDto;
    userRoleOrgPermissions?: unknown;
 }
 
 export class userRoleDto {
    id: string;
    name: string;
    permissions: string[];
 
 }
 
 export class OrgRole {
    id: string;
 }
 
 export class userOrgDto {
    id?: string;
    orgName?: string;
    orgRole?: OrgRole;
    agentEndPoint?: string;
    apiKey?: string;
 }
  