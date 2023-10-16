import { Prisma } from "@prisma/client";
export interface AttributeValue {
  attributeName: string;
  schemaDataType: string;
  displayName: string;
}

export interface RequestSchemaEndorsement {
  orgId: number
  name: string;
  version: string;
  attributes: AttributeValue[];
  endorse?: boolean;
}

export interface RequestCredDeffEndorsement {
  schemaId: string
  tag: string;
  endorse?: boolean;
}

export interface IAttributeValue {
  attributeName: string;
  schemaDataType: string;
  displayName: string
}

export interface SchemaTransactionPayload {
  endorserDid: string;
  endorse: boolean;
  attributes: string[];
  version: string;
  name: string;
  issuerId: string;
}

export interface CredDefTransactionPayload {
  endorserDid: string;
  endorse: boolean;
  tag: string;
  schemaId: string;
  issuerId: string;
}

export interface SchemaMessage {
  message?: {
    jobId: string;
    schemaState: {
      state: string;
      action: string;
      schemaId: string;
      schema: Record<string, unknown>;
      schemaRequest: string;
    };
    registrationMetadata: Record<string, unknown>;
    schemaMetadata: Record<string, unknown>;
  };
}

export interface CredDefMessage {
  message?: {
    jobId: string;
    credentialDefinitionState: {
      state: string;
      action: string;
      schemaId: string;
      schema: Record<string, unknown>;
      credentialDefinitionRequest: string;
      credentialDefinition: Record<string, unknown>;
    };
    registrationMetadata: Record<string, unknown>;
    schemaMetadata: Record<string, unknown>;
  };
}
export interface SchemaTransactionResponse {
  endorserDid: string;
  authorDid: string;
  requestPayload: string;
  status: string;
  ecosystemOrgId: string;
}

export interface SignedTransactionMessage {
  message?: {
    signedTransaction: string;
  };
}

export interface EndorsementTransactionPayload {
  id: string;
  endorserDid: string;
  authorDid: string;
  requestPayload: string;
  responsePayload: string;
  requestBody: Prisma.JsonValue
  status: string;
  ecosystemOrgId: string;
  createDateTime: Date;
  createdBy: number;
  lastChangedDateTime: Date;
  lastChangedBy: number;
  deletedAt?: Date;
  type?: string;
  ecosystemOrgs?: {
    orgId: string;
  };
}

interface SchemaPayload {
  attributes: string[];
  version: string;
  name: string;
  issuerId: string;
}

interface CredentialDefinitionPayload {
  tag: string;
  issuerId: string;
  schemaId: string;
  type: string;
  value: Record<string, unknown>;
}

export interface submitTransactionPayload {
  endorsedTransaction: string;
  endorserDid: string;
  schema?: SchemaPayload;
  credentialDefinition?: CredentialDefinitionPayload;
}


export interface SaveSchema {
  name: string;
  version: string;
  attributes: string;
  schemaLedgerId: string;
  issuerId: string;
  createdBy: string;
  lastChangedBy: string;
  publisherDid: string;
  orgId: string;
  ledgerId: number;
}

export interface saveCredDef {
  schemaLedgerId: string;
  tag: string;
  credentialDefinitionId: string;
  revocable: boolean;
  createdBy: string;
  orgId: number;
  schemaId: number;
}

export interface EndorsementTransactionPayloadDetails {
  id: string;
  endorserDid: string;
  authorDid: string;
  requestPayload: string;
  responsePayload: string;
  type: string;
  createDateTime: Date;
  createdBy: number;
  lastChangedDateTime: Date;
  lastChangedBy: number;
  deletedAt: Date | null;
  status: string;
  ecosystemOrgId: string;
  requestBody: unknown;
  ecosystemOrgs?: {
    orgId: string;
  };
}
