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
}

export interface IAttributeValue {
    attributeName: string;
    schemaDataType: string;
    displayName: string
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

