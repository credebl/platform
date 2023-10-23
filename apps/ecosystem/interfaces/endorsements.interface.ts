export interface GetEndorsementsPayload {
    ecosystemId: string;
    orgId: string;
    status: string;
    pageNumber: number;
    pageSize: number;
    search: string;
    type: string;
 }

 export interface GetAllSchemaList {
    ecosystemId: string;
    orgId: string;
    status: string;
    pageNumber: number;
    pageSize: number;
    search: string;
 }