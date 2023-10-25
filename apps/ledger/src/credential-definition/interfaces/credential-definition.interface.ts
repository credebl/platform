export interface CreateCredDefAgentRedirection {
    tenantId?: string;
    tag?: string;
    schemaId?: string;
    issuerId?: string;
    payload?: ITenantCredDef;
    method?: string;
    agentType?: number;
    apiKey?: string;
    agentEndPoint?: string;
}

export interface ITenantCredDef {
    tag: string;
    schemaId: string;
    issuerId: string;
}

export interface GetCredDefAgentRedirection {
    credentialDefinitionId?: string;
    tenantId?: string;
    payload?: GetCredDefFromTenantPayload;
    apiKey?: string;
    agentEndPoint?: string;
    agentType?: number;
    method?: string;
}

export interface GetCredDefFromTenantPayload {
    credentialDefinitionId: string;
}

export interface CredDefSchema {
    credentialDefinitionId: string;
    schemaCredDefName: string;
}

export interface BulkCredDefSchema {
    orgId: number
    sortValue: string,
    credDefSortBy: string
}
