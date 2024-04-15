export interface ICredDefDetails {
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    data: ICredDefData[];
}

export interface ICredDefData {
    createDateTime: Date;
    createdBy: string;
    credentialDefinitionId: string;
    tag: string;
    schemaLedgerId: string;
    schemaId: string;
    orgId: string;
    revocable: boolean;
}
