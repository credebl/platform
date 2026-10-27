/* eslint-disable @typescript-eslint/array-type */
import { ValidateBy, ValidationOptions, buildMessage, isString, isURL } from 'class-validator';
import { VC_CONTEXT_V1, VC_CONTEXT_V2 } from '@credebl/common/vc';
import { JsonObject } from '../interfaces';
export type SingleOrArray<T> = T | T[]
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonArray = Array<JsonValue>


export const isJsonObject = (value: unknown): value is JsonObject => value !== undefined && 'object' === typeof value && null !== value && !Array.isArray(value);
export const CREDENTIALS_CONTEXT_V1_URL = VC_CONTEXT_V1;
const SUPPORTED_BASE_CONTEXTS = [VC_CONTEXT_V1, VC_CONTEXT_V2];
export function IsCredentialJsonLdContext(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'IsCredentialJsonLdContext',
      validator: {
        validate: (value): boolean => {
          if (!Array.isArray(value)) { return false; }

          // First item must be the base context of a supported Verifiable Credential version
          if (!SUPPORTED_BASE_CONTEXTS.includes(value[0])) { return false; }

          return value.every((v) => (isString(v) && isURL(v)) || isJsonObject(v));
        },
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix 
            }$property must be an array of strings or objects, where the first item is the Verifiable Credential context URL (${SUPPORTED_BASE_CONTEXTS.join(' or ')}).`,
          validationOptions
        )
      }
    },
    validationOptions
  );
}