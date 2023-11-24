import { IUserRequestInterface } from "./interfaces/schema.interface";

export interface SchemaSearchCriteria {
    schemaLedgerId: string;
    credentialDefinitionId: string;
    user : IUserRequestInterface
}

export interface IAttributeValue {
    attributeName: string;
    schemaDataType: string;
    displayName: string
}

export interface CreateSchemaAgentRedirection {
    tenantId?: string;
    attributes?: string[];
    version?: string;
    name?: string;
    issuerId?: string;
    payload?: ITenantSchemaDto;
    method?: string;
    agentType?: string;
    apiKey?: string;
    agentEndPoint?: string;
}

export interface ITenantSchemaDto {
    attributes: string[];
    version: string;
    name: string;
    issuerId: string;
}

export interface GetSchemaAgentRedirection {
    schemaId?: string;
    tenantId?: string;
    payload?: GetSchemaFromTenantPayload;
    apiKey?: string;
    agentEndPoint?: string;
    agentType?: string;
    method?: string;
}

export interface GetSchemaFromTenantPayload {
    schemaId: string;
}
