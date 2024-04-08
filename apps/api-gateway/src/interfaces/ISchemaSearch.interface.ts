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
    schemaAttributes: W3CSchemaAttributes [];
    schemaName: string;
    did: string;
 }

 interface W3CSchemaAttributes {
    type: string,
    title: string
 }

 export interface ILedgers {
    id: string;
    createDateTime: string;
    lastChangedDateTime: string;
    name: string;
    networkType: string;
    poolConfig: string;
    isActive: boolean;
    networkString: string;
    registerDIDEndpoint: string;
    registerDIDPayload: string;
    indyNamespace: string;
    networkUrl: string | null;
  }
  