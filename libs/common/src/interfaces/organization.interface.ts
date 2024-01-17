export interface IOrganizationDashboard {
    usersCount: number,
    schemasCount: number,
    credentialsCount: number,
    presentationsCount:number
  }

  export interface IOrganizationInvitations {
    totalPages: number;
    invitations: IOrgInvitation[];
  }
  
  interface IOrgInvitation {
    id: string,
    orgId: string,
    email: string,
    userId: string,
    status: string,
    orgRoles: string[],
    createDateTime: Date,
    createdBy:string,
    organisation: IOrganizations;
  }
  
  interface IOrganizations {
    id: string;
    name: string;
    logoUrl: string;
  }
  