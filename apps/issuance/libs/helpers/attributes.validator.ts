import { W3CSchemaDataType } from '@credebl/enum/enum';
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
      // All values in IIssuanceAttributes are strings, so we need to validate
      // if the string value can be converted to the expected type
      let isValidType = true;
      
      switch (schemaDataType) {
        case W3CSchemaDataType.STRING:
          // String is always valid
          break;
        case W3CSchemaDataType.NUMBER:
        case W3CSchemaDataType.INTEGER:
          // Check if string can be converted to number
          if (isNaN(Number(attributeValue))) {
            isValidType = false;
          }
          break;
        case W3CSchemaDataType.BOOLEAN:
          // Check if string represents a valid boolean
          if (attributeValue !== 'true' && attributeValue !== 'false') {
            isValidType = false;
          }
          break;
        case W3CSchemaDataType.DATE_TIME:
          // Check if string is a valid ISO date
          if (isNaN(Date.parse(attributeValue))) {
            isValidType = false;
          }
          break;
        default:
          // For other types like ARRAY, OBJECT, assume string is valid
          break;
      }
      
      if (!isValidType) {
        mismatchedAttributes.push(
          `Attribute ${attributeName} has invalid value "${attributeValue}" for expected type ${schemaDataType}`
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
