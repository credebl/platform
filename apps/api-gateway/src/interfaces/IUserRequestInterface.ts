import { UserRoleOrgPermsDto } from '../authz/dtos/user-role-org-perms.dto';

export interface IUserRequestInterface {
    userId: number;    
    email: string; 
    orgId: number;  
    agentEndPoint?: string;
    apiKey?: string;
    tenantId?: number;
    tenantName?: string;
    tenantOrgId?: number; 
    userRoleOrgPermissions?: UserRoleOrgPermsDto[];  
    orgName?:string
}

