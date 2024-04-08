
export interface IPaginationDetails {
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number;
  previousPage: number;
  lastPage: number;
}


export interface ISchemasWithPagination extends IPaginationDetails{
    data: ISchemaData[];
  }

  export interface ISchemaData extends ISchema {
    orgId: string;
  }

  export interface ISchemaDetails extends IPaginationDetails{
    data: ISchema[];
  }
  
  interface ISchema {
    createDateTime: Date;
    createdBy: string;
    name: string;
    schemaLedgerId: string;
    version: string;
    attributes: string;
    publisherDid: string;
    issuerId: string;
  }
  

  export interface IPlatformSchemas {
    schemasCount: number;
    schemasResult: ISchemaData[];
  }
  
  export interface ICredDefData {
    tag: string;
    credentialDefinitionId: string;
    schemaLedgerId: string;
    revocable: boolean;
    createDateTime?: Date;
  }
  
  export interface ICredDefWithPagination extends IPaginationDetails{
      data: ICredDefData[];
  }

  export interface ICredDefWithCount {
    credDefCount: number;
    credDefResult: ICredDefData[];
  }  

  export interface INetworkUrl {
    networkUrl: string;
  }
