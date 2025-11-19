import { IUserRequestInterface } from '../../interfaces/IUserRequestInterface';

export interface IProofRequestAttribute {
    attributeName: string;
    condition?: string;
    value?: string;
    credDefId: string;
    credentialName: string;
}

export interface IProofRequestSearchCriteria {
    pageNumber: number;
    pageSize: number;
    sortField: string;
    sortBy: string;
    search: string;
    user?: IUserRequestInterface
}

export interface IProofRequest {
    metadata: object;
    id: string;
} 
export interface IProofPresentation {
    createdAt: string;
    protocolVersion: string;
    state: string;
    connectionId: string;
    threadId: string;
    autoAcceptProof: string;
    updatedAt: string;
    isVerified: boolean;
  }

export interface IPresentation {
    _tags: ITags;
    metadata: object;
    id: string;
    createdAt: string;
    protocolVersion: string;
    state: string;
    connectionId: string;
    threadId: string;
    autoAcceptProof: string;
    updatedAt: string;
    isVerified: boolean;
  }

interface ITags {
    connectionId: string;
    state: string;
    threadId: string;
}  

export interface IProofFormats {
    indy: IndyProof
}

interface IndyProof {
    name: string;
    version: string;
    requested_attributes: IRequestedAttributes;
    requested_predicates: IRequestedPredicates;
}

interface IRequestedAttributes {
    [key: string]: IRequestedAttributesName;
}

interface IRequestedAttributesName {
    name?: string;
    names?: string;
    restrictions: IRequestedRestriction[]
}

interface IRequestedPredicates {
    [key: string]: IRequestedPredicatesName;
}

interface IRequestedPredicatesName {
    name: string;
    restrictions: IRequestedRestriction[]
}

interface IRequestedRestriction {
    cred_def_id?: string;
    schema_id?: string;
    schema_issuer_did?: string;
    schema_name?: string;
    issuer_did?: string;
    schema_version?: string;
}