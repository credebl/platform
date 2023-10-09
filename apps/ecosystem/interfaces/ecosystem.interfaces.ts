export interface RequestSchemaEndorsement {
  orgId: number
  name: string;
  version: number;
  attributes: IAttributeValue[];
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
