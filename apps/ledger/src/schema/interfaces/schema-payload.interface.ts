import { SortValue } from '@credebl/enum/enum';
import { IUserRequestInterface } from './schema.interface';

export interface ISchema {
    schema?: ISchemaPayload;
    user?: IUserRequestInterface;
    createdBy?: number;
    issuerId?: string;
    changedBy?: number;
    ledgerId?: number;
    orgId?: number;
    onLedgerStatus?: string;
    credDefSortBy?: string;
    supportRevocation?: string;
    schemaId?: string;
    createTransactionForEndorser?: boolean;
    transactionId?: string;
    endorserWriteTxn?: string;
    orgDid?: string;
}

export interface ISchemaPayload {
    schemaVersion: string;
    schemaName: string;
    orgDid?: string;
    attributes: string[];
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

export interface ISchemaSearchInterface {
    schemaSearchCriteria: ISchemaSearchCriteria,
    user: IUserRequestInterface,
    orgId: number
}

export interface ISchemaSearchCriteria {
    pageNumber: number;
    pageSize: number;
    sorting: string;
    sortByValue: string;
    searchByText: string;
    user: IUserRequestInterface
}

export interface ISchemaCredDeffSearchInterface {
    schemaId: string;
    schemaSearchCriteria?: ISchemaSearchCriteria,
    user: IUserRequestInterface,
    orgId: number
}

