interface EcosystemRole {
    id: string;
    name: string;
    description: string;
    createDateTime: Date;
    lastChangedDateTime: Date;
    deletedAt: Date;
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
  
  export interface IPagination {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    ecosystemList: Ecosystem[];
  }
  