import { credentialSortBy } from '../enum';

export enum SortValue {
    ASC = 'ASC',
    DESC = 'DESC'
}
export interface IConnectedHolderList {
    orgId: string;
    itemsPerPage?: number;
    page?: number;
    searchText?: string;
    connectionSortBy?: string;
    sortValue?: string;
}


export interface CredentialListPayload {
    connectionId: string;
    itemsPerPage: number;
    page: number;
    searchText: string;
    sortValue: SortValue;
    credentialSortBy: string;
}

export interface GetCredentialListByConnectionId {
    connectionId: string,
    items_per_page: number,
    page: number,
    search_text: string,
    sortValue: SortValue,
    sortBy: credentialSortBy
}