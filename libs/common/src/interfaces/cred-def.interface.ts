export interface ICredDefCount {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    data: ICredDef[];
}

interface ICredDef {
    createDateTime: Date;
    createdBy: string;
    credentialDefinitionId: string;
    tag: string;
    schemaLedgerId: string;
    schemaId: string;
    orgId: string;
    revocable: boolean;
}
