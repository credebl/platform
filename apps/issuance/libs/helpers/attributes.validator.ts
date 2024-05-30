import { BadRequestException } from '@nestjs/common';
import { IIssuanceAttributes, ISchemaAttributes } from 'apps/issuance/interfaces/issuance.interfaces';

export function validateW3CSchemaAttributes(
  filteredIssuanceAttributes: IIssuanceAttributes,
  schemaUrlAttributes: ISchemaAttributes[]
): void {
  const mismatchedAttributes: string[] = [];
  const missingAttributes: string[] = [];

  for (const [key, value] of Object.entries(filteredIssuanceAttributes)) {
    const { type, title } = value || {};
    const schemaAttribute = schemaUrlAttributes.find((attr) => attr.attributeName === key);

    if (!type) {
      mismatchedAttributes.push(`Attribute ${key} must have a type`);
      continue;
    }

    if (!schemaAttribute) {
      mismatchedAttributes.push(`Attribute ${key} is not defined in the schema`);
      continue;
    }

    if (schemaAttribute.schemaDataType !== type) {
      mismatchedAttributes.push(
        `Attribute ${key} has type ${type || null} but expected type ${schemaAttribute.schemaDataType}`
      );
      continue;
    }

    if (schemaAttribute.isRequired && !title) {
      mismatchedAttributes.push(`Attribute ${key} must have a non-empty title`);
      continue;
    }

    if (title !== undefined && null !== title && typeof title !== schemaAttribute.schemaDataType) {
      mismatchedAttributes.push(
        `Attribute ${key} must have a title of type ${schemaAttribute.schemaDataType}`
      );
    }

  }

  for (const schemaAttribute of schemaUrlAttributes) {
    if (!(schemaAttribute.attributeName in filteredIssuanceAttributes)) {
      missingAttributes.push(`Attribute ${schemaAttribute.attributeName} is missing`);
    }
  }

  if (0 < missingAttributes.length) {
    throw new BadRequestException(`Validation failed: ${missingAttributes.join(', ')}`);
  }

  if (0 < mismatchedAttributes.length) {
    throw new BadRequestException(`Validation failed: ${mismatchedAttributes.join(', ')}`);
  }
}
