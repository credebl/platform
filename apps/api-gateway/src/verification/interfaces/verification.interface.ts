import { IUserRequestInterface } from "../../interfaces/IUserRequestInterface";

export interface IProofRequestAttribute {
    attributeName: string;
    condition?: string;
    value?: string;
    credDefId: string;
    credentialName: string;
}

export interface IProofRequestsSearchCriteria {
    pageNumber: number;
    pageSize: number;
    sorting: string;
    sortByValue: string;
    searchByText: string;
    user?: IUserRequestInterface
}
