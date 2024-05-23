import { BadRequestException } from '@nestjs/common';
import {
  IIssuanceAttributes,
  ISchemaAttributes
} from 'apps/issuance/interfaces/issuance.interfaces';

export function validateW3CSchemaAttributes(
  filteredIssuanceAttributes: IIssuanceAttributes,
  schemaUrlAttributes: ISchemaAttributes
): void {
  const mismatchedAttributes: string[] = [];
  const missingAttributes: string[] = [];

  for (const [key, value] of Object.entries(filteredIssuanceAttributes)) {
    const { type, title } = value || {};

    if (!title) {
      mismatchedAttributes.push(`Validation failed: Attribute ${key} must have a title`);
    } else {
      const titleType = typeof title;
      switch (type) {
        case 'string':
          if ('string' !== titleType) {
            mismatchedAttributes.push(`Validation failed: Attribute ${key} must have a title of type string`);
          }
          break;
        case 'number':
          if ('number' !== titleType) {
            mismatchedAttributes.push(`Validation failed: Attribute ${key} must have a title of type number`);
          }
          break;
        case 'boolean':
          if ('boolean' !== titleType) {
            mismatchedAttributes.push(`Validation failed: Attribute ${key} must have a title of type boolean`);
          }
          break;
        default:
          mismatchedAttributes.push(`Validation failed: Attribute ${key} has an unsupported type ${type}`);
      }
    }

    const schemaAttribute = schemaUrlAttributes[key];
    if (!schemaAttribute) {
      mismatchedAttributes.push(`Attribute ${key} is not defined in the schema`);
    } else if (schemaAttribute.type !== type) {
      mismatchedAttributes.push(
        `Attribute ${key} has type ${type || null} but expected type ${schemaAttribute.type}`
      );
    }
  }

  for (const key of Object.keys(schemaUrlAttributes)) {
    if (!(key in filteredIssuanceAttributes)) {
      missingAttributes.push(`Attribute ${key} is missing`);
    }
  }

  if (0 < missingAttributes.length) {
    throw new BadRequestException(`Validation failed: ${missingAttributes.join(', ')}`);
  }

  if (0 < mismatchedAttributes.length) {
    throw new BadRequestException(`Validation failed: ${mismatchedAttributes.join(', ')}`);
  }

}
