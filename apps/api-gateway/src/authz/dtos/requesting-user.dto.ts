/* eslint-disable camelcase */
import { UserRoleOrgPermsDto } from './user-role-org-perms.dto';

export class RequestingUser {
    userId: number;
    username: string;
    //roleId: number;
    email: string;
    //permissions: string[];
    orgId: number;
    //org?: OrganizationDto;
    name?: string;
    agentEndPoint?: string;
    apiKey?: string;
    tenant_id?: number;
    tenant_name?: string;
    userRoleOrgPermissions: UserRoleOrgPermsDto[];
    tenantOrgId?: number;
}

