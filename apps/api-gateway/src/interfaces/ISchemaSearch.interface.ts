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
  

export interface W3CSchemaPayload {
    schema: object;
    schemaName: string;
    did: string;
 }
