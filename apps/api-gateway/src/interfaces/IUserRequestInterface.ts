import { UserRoleOrgPermsDto } from '../authz/dtos/user-role-org-perms.dto';

export interface IUserRequestInterface {
    id: string;
    userId: string;    
    email: string; 
    orgId: string;  
    agentEndPoint?: string;
    apiKey?: string;
    tenantId?: string;
    tenantName?: string;
    tenantOrgId?: string; 
    userRoleOrgPermissions?: UserRoleOrgPermsDto[];  
    orgName?:string
}

