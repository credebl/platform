interface EcosystemRole {
    id: string;
    name: string;
    description: string;
    createDateTime: Date;
    lastChangedDateTime: Date;
    deletedAt: Date;
  }

  export interface IEcosystemOrgs {
    id: string;
    orgId: string;
    status: string;
    deploymentMode: string;
    ecosystemId: string;
    ecosystemRoleId: string;
    createDateTime: string;
    createdBy: string;
    lastChangedDateTime: string;
    lastChangedBy: string;
    deletedAt: string;
  }
   
interface Ecosystem {
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    createDateTime: string;
    lastChangedDateTime: string;
    createdBy: string;
    autoEndorsement: boolean;
    ecosystemOrgs: EcosystemOrg[];
  }
  
  interface EcosystemOrg {
    id: string;
    orgId: string;
    status: string;
    createDateTime: string;
    lastChangedDateTime: string;
    ecosystemId: string;
    ecosystemRoleId: string;
    ecosystemRole: EcosystemRole;
  }
  
  export interface IEcosystemDetails {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    ecosystemList: Ecosystem[];
  }
  