export interface IUserRequestInterface {
  userId: string;
  email: string;
  orgId: string;
  agentEndPoint?: string;
  apiKey?: string;
  orgName?: string;
  selectedOrg: ISelectedOrgInterface;
}

export interface ISelectedOrgInterface {
    id: string;
    userId: string;
    orgRoleId: string;
    orgId: string;
    orgRole: object;
    organisation: IOrganizationInterface;
}

export interface IOrganizationInterface {
    name: string;
    description: string;
}
