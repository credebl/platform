import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { validateW3CSchemaAttributes } from '../libs/helpers/attributes.validator';
import { W3CSchemaDataType } from '@credebl/enum/enum';

describe('IssuanceService - Attribute Validation', () => {
  describe('validateW3CSchemaAttributes Integration', () => {
    it('should validate attributes using the same logic as IssuanceService', () => {
      const schemaAttributes = [
        {
          attributeName: 'name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          displayName: 'Full Name'
        },
        {
          attributeName: 'age',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: false,
          displayName: 'Age'
        },
        {
          attributeName: 'email',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          displayName: 'Email'
        }
      ];

      const validAttributes = {
        name: 'John Doe',
        age: '30',
        email: 'john@example.com'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, schemaAttributes);
      }).not.toThrow();
    });

    it('should throw error for invalid numeric attribute', () => {
      const schemaAttributes = [
        {
          attributeName: 'age',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          displayName: 'Age'
        }
      ];

      const invalidAttributes = {
        age: 'not-a-number'
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, schemaAttributes);
      }).toThrow(BadRequestException);
    });

    it('should throw error for missing required attribute', () => {
      const schemaAttributes = [
        {
          attributeName: 'name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          displayName: 'Name'
        }
      ];

      const invalidAttributes = {};

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, schemaAttributes);
      }).toThrow(BadRequestException);
    });
  });
});
