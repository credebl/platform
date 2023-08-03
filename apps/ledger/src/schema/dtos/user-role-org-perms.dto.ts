
export class UserRoleOrgPermsDto {
    id?: number;
    role?: userRoleDto;
    organization?: userOrgDto;
    userRoleOrgPermissions?: unknown;
 }
 
 export class userRoleDto {
    id: number;
    name: string;
    permissions: string[];
 
 }
 
 export class OrgRole {
    id: number;
 }
 
 export class userOrgDto {
    id?: number;
    orgName?: string;
    orgRole?: OrgRole;
    agentEndPoint?: string;
    apiKey?: string;
 }
  