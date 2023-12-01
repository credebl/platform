export interface IUserRequest {
    userId: string;
    email: string;
    orgId: string;
    agentEndPoint?: string;
    apiKey?: string;
    tenantId?: string;
    tenantName?: string;
    tenantOrgId?: string;
    userRoleOrgPermissions?: IUserRoleOrgPerms[];
    orgName?: string;
    selectedOrg: ISelectedOrg;
}

export interface ISelectedOrg {
    id: string;
    userId: string;
    orgRoleId: string;
    orgId: string;
    orgRole: object;
    organisation: object;
}

export interface IOrganization {
    name: string;
    description: string;
    org_agents: IOrgAgent[]

}

export interface IOrgAgent {
    orgDid: string;
    verkey: string;
    agentEndPoint: string;
    agentOptions: string;
    walletName: string;
    agentsTypeId: string;
    orgId: string;
}

export class IUserRoleOrgPerms {
    id: string;
    role: IUserRole;
    Organization: IUserOrg;
}

export class IUserRole {
    id: string;
    name: string;
    permissions: string[];

}

export class IUserOrg {
    id: string;
    orgName: string;
}