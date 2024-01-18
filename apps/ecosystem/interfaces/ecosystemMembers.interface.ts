export interface EcosystemMembersPayload { 
    ecosystemId: string;
    orgId: string,
    pageNumber: number;
    pageSize: number;
    search: string;
    sortBy: string; 
}