import { BadRequestException } from '@nestjs/common';
import { IIssuanceAttributes, ISchemaAttributes } from 'apps/issuance/interfaces/issuance.interfaces';

export function validateW3CSchemaAttributes(
  filteredIssuanceAttributes: IIssuanceAttributes,
  schemaUrlAttributes: ISchemaAttributes[]
): void {
  const mismatchedAttributes: string[] = [];
  const missingAttributes: string[] = [];
  const extraAttributes: string[] = [];

  const schemaAttributesSet = new Set(schemaUrlAttributes.map((attr) => attr.attributeName));

  for (const schemaAttribute of schemaUrlAttributes) {
    const { attributeName, schemaDataType, isRequired } = schemaAttribute;
    const attributeValue = filteredIssuanceAttributes[attributeName];

    if (isRequired && attributeValue === undefined) {
      missingAttributes.push(`Attribute ${attributeName} is missing`);
      continue;
    }

    if (isRequired && !attributeValue) {
      mismatchedAttributes.push(`Attribute ${attributeName} must have a non-empty value`);
      continue;
    }

    if (attributeValue !== undefined) {
      const actualType = typeof attributeValue;
      if (actualType !== schemaDataType) {
        mismatchedAttributes.push(
          `Attribute ${attributeName} has type ${actualType} but expected type ${schemaDataType}`
        );
      }
    }
  }

  for (const attributeName in filteredIssuanceAttributes) {
    if (!schemaAttributesSet.has(attributeName)) {
      extraAttributes.push(`Attribute ${attributeName} is not defined in the schema`);
    }
  }

  if (0 < missingAttributes.length) {
    throw new BadRequestException(`Validation failed: ${missingAttributes.join(', ')}`);
  }

  if (0 < mismatchedAttributes.length) {
    throw new BadRequestException(`Validation failed: ${mismatchedAttributes.join(', ')}`);
  }

  if (0 < extraAttributes.length) {
    throw new BadRequestException(`Validation failed: ${extraAttributes.join(', ')}`);
  }
}
