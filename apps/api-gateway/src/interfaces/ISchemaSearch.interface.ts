import { IUserRequestInterface } from '../schema/interfaces';

export interface ISchemaSearchPayload {
    ledgerId?: string;
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    searchByText?: string;
    user?: IUserRequestInterface
}

export interface IConnectionSearchinterface {
    pageNumber: number;
    pageSize: number;
    sorting: string;
    sortByValue: string;
    searchByText: string;
    user?: IUserRequestInterface
}
