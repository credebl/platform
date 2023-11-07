export interface IUserRequestInterface {
    userId: number;
    email: string;
    orgId: number;
    agentEndPoint?: string;
    apiKey?: string;
    tenantId?: number;
    tenantName?: string;
    tenantOrgId?: number;
    userRoleOrgPermissions?: IUserRoleOrgPerms[];
    orgName?: string;
    selectedOrg: ISelectedOrg;
}

export interface ISelectedOrg {
    id: number;
    userId: number;
    orgRoleId: number;
    orgId: number;
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
    id: number;
    role: IUserRole;
    Organization: IUserOrg;
}

export class IUserRole {
    id: number;
    name: string;
    permissions: string[];

}

export class IUserOrg {
    id: number;
    orgName: string;
}

export interface FileExportResponse {
    response: unknown;
    fileContent: string;
    fileName : string
}

export interface RequestPayload {
    credDefId: string;
    filePath: string;
    fileName: string;
  }
