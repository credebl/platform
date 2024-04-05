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

 interface ISchemaResult {
   createDateTime: Date;
   createdBy: string;
   name: string;
   version: string;
   attributes: string;
   schemaLedgerId: string;
   publisherDid: string;
   issuerId: string;
   orgId: string;
 }
 
 export interface ISchemasResponse {
   schemasCount: number;
   schemasResult: ISchemaResult[];
 }
 