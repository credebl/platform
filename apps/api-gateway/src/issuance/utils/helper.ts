/* eslint-disable @typescript-eslint/array-type */
import { ValidateBy, ValidationOptions, buildMessage, isString, isURL } from 'class-validator';
import { JsonObject } from '../interfaces';
export type SingleOrArray<T> = T | T[]
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonArray = Array<JsonValue>


export const isJsonObject = (value: unknown): value is JsonObject => value !== undefined && 'object' === typeof value && null !== value && !Array.isArray(value);
export const CREDENTIALS_CONTEXT_V1_URL = 'https://www.w3.org/2018/credentials/v1';
export function IsCredentialJsonLdContext(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'IsCredentialJsonLdContext',
      validator: {
        validate: (value): boolean => {
          if (!Array.isArray(value)) { return false; }

          // First item must be the verifiable credential context
          if (value[0] !== CREDENTIALS_CONTEXT_V1_URL) { return false; }

          return value.every((v) => (isString(v) && isURL(v)) || isJsonObject(v));
        },
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix 
            }$property must be an array of strings or objects, where the first item is the verifiable credential context URL.`,
          validationOptions
        )
      }
    },
    validationOptions
  );
}