export interface IUserRequestInterface {
  userId: number;
  email: string;
  orgId: number;
  agentEndPoint?: string;
  apiKey?: string;
  orgName?: string;
  selectedOrg: ISelectedOrgInterface;
}

export interface ISelectedOrgInterface {
    id: number;
    userId: number;
    orgRoleId: number;
    orgId: number;
    orgRole: object;
    organisation: IOrganizationInterface;
}

export interface IOrganizationInterface {
    name: string;
    description: string;
}
