import { IUserRequestInterface } from './IUserRequestInterface';

export interface IConnectionSearchCriteria {
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    searchByText: string;
    user?: IUserRequestInterface
}
