/* eslint-disable @typescript-eslint/array-type */
import { ValidateBy, ValidationOptions, buildMessage, isString, isURL } from 'class-validator';
import { IssueCredentialType, JsonObject } from '../interfaces';
import { ConnectionAttributes } from '../dtos/multi-connection.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ResponseMessages } from '@credebl/common/response-messages';
import { AnonCredsDto, CredentialOffer, IndyDto, JsonLdDto } from '../dtos/issuance.dto';
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

export function validateCredential(credentialType: IssueCredentialType, credOffer: ConnectionAttributes[] | CredentialOffer[]): void {
  if (
    credentialType !== IssueCredentialType.INDY &&
    credentialType !== IssueCredentialType.JSONLD &&
    credentialType !== IssueCredentialType.ANONCREDS
  ) {
    throw new NotFoundException(ResponseMessages.issuance.error.invalidCredentialType);
  }

  for (let i = 0; i < credOffer.length; i++) {
    const offer = credOffer[i];
    const {credentialFormats} = offer;

    // Extract the key from credentialFormats
    // eslint-disable-next-line prefer-destructuring
    const credentialFormatKey = Object.keys(credentialFormats)[0];

    // Verify if the key matches the credentialType
    if (!credentialFormatKey || credentialFormatKey.toLowerCase() !== credentialType) {
      throw new BadRequestException(`Credential type mismatch at index ${i}. Expected ${credentialType} but got ${credentialFormatKey}`);
    }

    if (credentialType === IssueCredentialType.INDY) {
      const indy = (credentialFormats as IndyDto)?.indy;

      if (!indy || !indy.credentialDefinitionId) {
        throw new BadRequestException(`${ResponseMessages.credentialDefinition.error.isRequired} at index ${i}`);
      }

      if (!indy.attributes || !Array.isArray(indy.attributes) || 0 === indy.attributes.length) {
        throw new BadRequestException(`${ResponseMessages.issuance.error.attributesAreRequired} at index ${i}`);
      }
    }

    if (credentialType === IssueCredentialType.ANONCREDS) {
      const anoncreds = (credentialFormats as AnonCredsDto)?.anoncreds;

      if (!anoncreds || !anoncreds.credentialDefinitionId) {
        throw new BadRequestException(`${ResponseMessages.credentialDefinition.error.isRequired} at index ${i}`);
      }

      if (!anoncreds.attributes || !Array.isArray(anoncreds.attributes) || 0 === anoncreds.attributes.length) {
        throw new BadRequestException(`${ResponseMessages.issuance.error.attributesAreRequired} at index ${i}`);
      }
    }

    if (credentialType === IssueCredentialType.JSONLD) {
      const jsonld = (credentialFormats as JsonLdDto)?.jsonld;

      if (!jsonld || !jsonld.credential || 0 === Object.keys(jsonld.credential).length) {
        throw new BadRequestException(`${ResponseMessages.issuance.error.credentialNotPresent} at index ${i}`);
      }

      if (!jsonld.options || 0 === Object.keys(jsonld.options).length) {
        throw new BadRequestException(`${ResponseMessages.issuance.error.optionsNotPresent} at index ${i}`);
      }
    }
  }
}
