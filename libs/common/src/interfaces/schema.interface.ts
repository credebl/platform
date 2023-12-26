
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

  export interface ISchemaData {
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
  