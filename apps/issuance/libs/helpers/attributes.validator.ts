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

    switch (true) {
      case !type:
        mismatchedAttributes.push(`Attribute ${key} must have a type`);
        break;

      case !schemaAttribute:
        mismatchedAttributes.push(`Attribute ${key} is not defined in the schema`);
        break;

      case schemaAttribute.schemaDataType !== type:
        mismatchedAttributes.push(
          `Attribute ${key} has type ${type || null} but expected type ${schemaAttribute.schemaDataType}`
        );
        break;

      case schemaAttribute.isRequired && !title:
        mismatchedAttributes.push(`Attribute ${key} must have a non-empty title`);
        break;

      case title !== undefined && null !== title && typeof title !== schemaAttribute.schemaDataType:
        mismatchedAttributes.push(`Attribute ${key} must have a title of type ${schemaAttribute.schemaDataType}`);
        break;

      default:
        break;
    }
  }

  for (const schemaAttribute of schemaUrlAttributes) {
    if (schemaAttribute.isRequired && !(schemaAttribute.attributeName in filteredIssuanceAttributes)) {
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
