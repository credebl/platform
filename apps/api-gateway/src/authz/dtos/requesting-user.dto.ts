/* eslint-disable camelcase */
import { UserRoleOrgPermsDto } from './user-role-org-perms.dto';

export class RequestingUser {
    userId: string;
    username: string;
    //roleId: number;
    email: string;
    //permissions: string[];
    orgId: string;
    //org?: OrganizationDto;
    name?: string;
    agentEndPoint?: string;
    apiKey?: string;
    tenant_id?: string;
    tenant_name?: string;
    userRoleOrgPermissions: UserRoleOrgPermsDto[];
    tenantOrgId?: string;
}

