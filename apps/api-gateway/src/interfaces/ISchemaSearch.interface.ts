import { IUserRequestInterface } from '../schema/interfaces';

export interface ISchemaSearchInterface {
    ledgerId?: string;
    pageNumber: number;
    pageSize: number;
    sorting: string;
    sortByValue: string;
    searchByText: string;
    user?: IUserRequestInterface
}

export interface ICredDeffSchemaSearchInterface {
    pageNumber: number;
    pageSize: number;
    sorting: string;
    sortByValue: string;
    user?: IUserRequestInterface
}