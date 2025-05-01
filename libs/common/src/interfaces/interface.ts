import { W3CSchemaDataType } from '@credebl/enum/enum';

export interface ResponseType {
  statusCode: number;
  message: string;
  data?: Record<string, unknown> | string;
  error?: Record<string, unknown> | string;
}

export interface IAccessTokenData {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

export interface IOptionalParams {
  alias?: string;
  myDid?: string;
  outOfBandId?: string;
  state?: string;
  theirDid?: string;
  theirLabel?: string;
  threadId?: string;
  connectionId?: string;
}

export interface IFormattedResponse {
  message: string;
  data: unknown;
  success: boolean;
  code: number;
}

export interface IW3CAttributeValue {
  attributeName: string;
  schemaDataType: W3CSchemaDataType;
  displayName: string;
  isRequired: boolean;
  description?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  contentEncoding?: string;
  contentMediaType?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: IW3CAttributeValue[];
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean;
  required?: string[];
  dependentRequired?: Record<string, string[]>;
  properties?: Record<string, IW3CAttributeValue>;
}
