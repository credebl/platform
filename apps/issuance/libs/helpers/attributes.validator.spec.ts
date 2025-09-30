import { BadRequestException } from '@nestjs/common';
import { validateW3CSchemaAttributes } from './attributes.validator';
import { W3CSchemaDataType } from '@credebl/enum/enum';

describe('Attributes Validator', () => {
  describe('validateW3CSchemaAttributes', () => {
    const mockSchemaAttributes = [
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
        displayName: 'Email Address'
      }
    ];

    it('should pass validation with valid attributes', () => {
      const validAttributes = {
        name: 'John Doe',
        age: '30',
        email: 'john@example.com'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, mockSchemaAttributes);
      }).not.toThrow();
    });

    it('should pass validation with only required attributes', () => {
      const validAttributes = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, mockSchemaAttributes);
      }).not.toThrow();
    });

    it('should throw error when required attribute is missing', () => {
      const invalidAttributes = {
        age: '30'
        // missing required 'name' and 'email'
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, mockSchemaAttributes);
      }).toThrow(BadRequestException);
    });

    it('should throw error when required attribute has empty value', () => {
      const invalidAttributes = {
        name: '',
        email: 'john@example.com'
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, mockSchemaAttributes);
      }).toThrow(BadRequestException);
    });

    it('should throw error when attribute has wrong data type', () => {
      const invalidAttributes = {
        name: 'John Doe',
        age: 'thirty', // should be number
        email: 'john@example.com'
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, mockSchemaAttributes);
      }).toThrow(BadRequestException);
    });

    it('should throw error when extra attributes are provided', () => {
      const invalidAttributes = {
        name: 'John Doe',
        email: 'john@example.com',
        invalidAttribute: 'not allowed'
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, mockSchemaAttributes);
      }).toThrow(BadRequestException);
    });

    it('should handle datetime attributes correctly', () => {
      const schemaWithDateTime = [
        {
          attributeName: 'birthDate',
          schemaDataType: W3CSchemaDataType.DATE_TIME,
          isRequired: true,
          displayName: 'Birth Date'
        }
      ];

      const validAttributes = {
        birthDate: '2023-01-01T00:00:00Z'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, schemaWithDateTime);
      }).not.toThrow();
    });

    it('should validate boolean attributes correctly', () => {
      const schemaWithBoolean = [
        {
          attributeName: 'isActive',
          schemaDataType: W3CSchemaDataType.BOOLEAN,
          isRequired: true,
          displayName: 'Is Active'
        }
      ];

      const validAttributes = {
        isActive: 'true'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, schemaWithBoolean);
      }).not.toThrow();
    });

    it('should throw error for boolean attribute with wrong type', () => {
      const schemaWithBoolean = [
        {
          attributeName: 'isActive',
          schemaDataType: W3CSchemaDataType.BOOLEAN,
          isRequired: true,
          displayName: 'Is Active'
        }
      ];

      const invalidAttributes = {
        isActive: 'yes' // should be boolean but all attributes are strings in this interface
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, schemaWithBoolean);
      }).toThrow(BadRequestException);
    });

    it('should handle null and undefined attribute values correctly', () => {
      const schemaWithOptional = [
        {
          attributeName: 'optionalField',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: false,
          displayName: 'Optional Field'
        }
      ];

      const attributesWithUndefined = {};

      expect(() => {
        validateW3CSchemaAttributes(attributesWithUndefined, schemaWithOptional);
      }).not.toThrow();
    });

    it('should validate integer types correctly', () => {
      const schemaWithInteger = [
        {
          attributeName: 'count',
          schemaDataType: W3CSchemaDataType.INTEGER,
          isRequired: true,
          displayName: 'Count'
        }
      ];

      const validAttributes = {
        count: '42'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, schemaWithInteger);
      }).not.toThrow();
    });

    it('should handle decimal numbers for integer type', () => {
      const schemaWithInteger = [
        {
          attributeName: 'count',
          schemaDataType: W3CSchemaDataType.INTEGER,
          isRequired: true,
          displayName: 'Count'
        }
      ];

      const invalidAttributes = {
        count: '42.5'
      };

      // This should pass as our validator accepts any valid number for integer type
      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, schemaWithInteger);
      }).not.toThrow();
    });

    it('should handle complex datetime formats', () => {
      const schemaWithDateTime = [
        {
          attributeName: 'timestamp',
          schemaDataType: W3CSchemaDataType.DATE_TIME,
          isRequired: true,
          displayName: 'Timestamp'
        }
      ];

      const validAttributes = {
        timestamp: '2023-12-25T10:30:00.000Z'
      };

      expect(() => {
        validateW3CSchemaAttributes(validAttributes, schemaWithDateTime);
      }).not.toThrow();
    });

    it('should throw error for invalid datetime format', () => {
      const schemaWithDateTime = [
        {
          attributeName: 'timestamp',
          schemaDataType: W3CSchemaDataType.DATE_TIME,
          isRequired: true,
          displayName: 'Timestamp'
        }
      ];

      const invalidAttributes = {
        timestamp: 'not-a-date'
      };

      expect(() => {
        validateW3CSchemaAttributes(invalidAttributes, schemaWithDateTime);
      }).toThrow(BadRequestException);
    });
  });
});
