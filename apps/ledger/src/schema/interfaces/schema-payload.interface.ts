import { SortValue } from '@credebl/enum/enum';
import { IUserRequestInterface } from './schema.interface';

export interface ISchema {
    schema?: ISchemaPayload;
    user?: IUserRequestInterface;
    createdBy?: string;
    issuerId?: string;
    changedBy?: string;
    ledgerId?: string;
    orgId?: string;
    onLedgerStatus?: string;
    credDefSortBy?: string;
    supportRevocation?: string;
    schemaId?: string;
    createTransactionForEndorser?: boolean;
    transactionId?: string;
    endorserWriteTxn?: string;
    orgDid?: string;
    type?: string;
}

export interface IAttributeValue {
    isRequired: boolean;    
    attributeName: string;
    schemaDataType: string;
    displayName: string;

}

export interface ISchemaPayload {
    schemaVersion: string;
    schemaName: string;
    orgDid?: string;
    attributes: IAttributeValue[];
    issuerId?: string;
    onLedgerStatus?: string;
    id?: string;
    user?: IUserRequestInterface;
    page?: number;
    searchText?: string
    itemsPerPage?: number;
    sortValue?: SortValue;
    schemaSortBy?: string;
}

export interface ISchemaSearchPayload {
    schemaSearchCriteria: ISchemaSearchCriteria,
    user: IUserRequestInterface,
    orgId: string
}

export interface ISchemaSearchCriteria {
    ledgerId?: string;
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    searchByText?: string;
    user?: IUserRequestInterface
    schemaId?: string;
    orgId?: string;
}

export interface ISchemaCredDeffSearchInterface {
    schemaId: string;
    schemaSearchCriteria?: ISchemaSearchCriteria,
    user: IUserRequestInterface,
}

export interface ISchemaExist {
   schemaName: string;
   version: string;
}

export interface SchemaPayload {
    schemaAttributes: W3CSchemaAttributes [],
    schemaName: string,
    did: string,
    description: string
    jsonSchemaType?: string
  }

  export interface W3CSchemaAttributes {
    type: string,
    title: string,
 }
  
export interface W3CSchemaPayload {
    schemaPayload: SchemaPayload,
    orgId: string,
    user: string
  }

export interface W3CCreateSchema {
    url: string,
    orgId: string,
    schemaRequestPayload: object
}  

export interface IdAttribute extends W3CSchemaAttributes {
    format: string;
    order?: string
}   

