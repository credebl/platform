/* eslint-disable @typescript-eslint/array-type */
import {
  ValidateBy,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  buildMessage,
  isString,
  isURL
} from 'class-validator';
import { JsonObject } from '../interfaces';
export type SingleOrArray<T> = T | T[];
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonArray = Array<JsonValue>;

export const isJsonObject = (value: unknown): value is JsonObject =>
  value !== undefined && 'object' === typeof value && null !== value && !Array.isArray(value);
export const CREDENTIALS_CONTEXT_V1_URL = 'https://www.w3.org/2018/credentials/v1';
export function IsCredentialJsonLdContext(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'IsCredentialJsonLdContext',
      validator: {
        validate: (value): boolean => {
          if (!Array.isArray(value)) {
            return false;
          }

          // First item must be the verifiable credential context
          if (value[0] !== CREDENTIALS_CONTEXT_V1_URL) {
            return false;
          }

          return value.every((v) => (isString(v) && isURL(v)) || isJsonObject(v));
        },
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${
              eachPrefix
            }$property must be an array of strings or objects, where the first item is the verifiable credential context URL.`,
          validationOptions
        )
      }
    },
    validationOptions
  );
}

@ValidatorConstraint({ name: 'ValidateAttributeKeys', async: false })
export class ValidateAttributeKeys implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  validate(obj: Record<string, any>, args: ValidationArguments): boolean {
    if (!obj || 'object' !== typeof obj) {
      return false;
    }

    return Object.keys(obj).every((key) => 'string' === typeof key && 20 >= key.length);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} keys must be strings with max length of 20`;
  }
}
