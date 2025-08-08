import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateW3CSchemaDto, W3CAttributeValue, GenericSchemaDTO } from './create-schema.dto';
import { W3CSchemaDataType, SchemaTypeEnum, JSONSchemaType } from '@credebl/enum/enum';

describe('Schema Creation DTOs - Validation Tests', () => {
  describe('W3CAttributeValue DTO', () => {
    it('should validate a valid W3C attribute', async () => {
      const validAttribute = {
        attributeName: 'name',
        displayName: 'Full Name',
        schemaDataType: W3CSchemaDataType.STRING,
        isRequired: true,
        description: 'The person full name'
      };

      const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
      const errors = await validate(attributeDto);

      expect(errors.length).toBe(0);
    });

    it('should reject empty attributeName', async () => {
      const invalidAttribute = {
        attributeName: '',
        displayName: 'Full Name',
        schemaDataType: W3CSchemaDataType.STRING,
        isRequired: true
      };

      const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
      const errors = await validate(attributeDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject empty displayName', async () => {
      const invalidAttribute = {
        attributeName: 'name',
        displayName: '',
        schemaDataType: W3CSchemaDataType.STRING,
        isRequired: true
      };

      const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
      const errors = await validate(attributeDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject invalid schemaDataType', async () => {
      const invalidAttribute = {
        attributeName: 'name',
        displayName: 'Full Name',
        schemaDataType: 'INVALID_TYPE',
        isRequired: true
      };

      const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
      const errors = await validate(attributeDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should require isRequired property', async () => {
      const invalidAttribute = {
        attributeName: 'name',
        displayName: 'Full Name',
        schemaDataType: W3CSchemaDataType.STRING
        // Missing isRequired
      };

      const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
      const errors = await validate(attributeDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    describe('String Attribute Validations', () => {
      it('should validate minLength for string type', async () => {
        const validAttribute = {
          attributeName: 'username',
          displayName: 'Username',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          minLength: 3
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate maxLength for string type', async () => {
        const validAttribute = {
          attributeName: 'description',
          displayName: 'Description',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: false,
          maxLength: 500
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate pattern for string type', async () => {
        const validAttribute = {
          attributeName: 'email',
          displayName: 'Email',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate enum for string type', async () => {
        const validAttribute = {
          attributeName: 'status',
          displayName: 'Status',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          enum: ['active', 'inactive', 'pending']
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should reject invalid minLength (negative)', async () => {
        const invalidAttribute = {
          attributeName: 'name',
          displayName: 'Name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          minLength: -1
        };

        const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('min');
      });

      it('should reject invalid maxLength (zero)', async () => {
        const invalidAttribute = {
          attributeName: 'name',
          displayName: 'Name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          maxLength: 0
        };

        const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('min');
      });
    });

    describe('Number Attribute Validations', () => {
      it('should validate minimum for number type', async () => {
        const validAttribute = {
          attributeName: 'age',
          displayName: 'Age',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          minimum: 0
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate maximum for number type', async () => {
        const validAttribute = {
          attributeName: 'score',
          displayName: 'Score',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          maximum: 100
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate multipleOf for number type', async () => {
        const validAttribute = {
          attributeName: 'price',
          displayName: 'Price',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          multipleOf: 0.01
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should reject invalid multipleOf (negative)', async () => {
        const invalidAttribute = {
          attributeName: 'price',
          displayName: 'Price',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          multipleOf: -0.01
        };

        const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isPositive');
      });
    });

    describe('Array Attribute Validations', () => {
      it('should validate minItems for array type', async () => {
        const validAttribute = {
          attributeName: 'skills',
          displayName: 'Skills',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          minItems: 1,
          items: [{
            attributeName: 'skill',
            displayName: 'Skill',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }]
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate maxItems for array type', async () => {
        const validAttribute = {
          attributeName: 'tags',
          displayName: 'Tags',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          maxItems: 10,
          items: [{
            attributeName: 'tag',
            displayName: 'Tag',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }]
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate uniqueItems for array type', async () => {
        const validAttribute = {
          attributeName: 'categories',
          displayName: 'Categories',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          uniqueItems: true,
          items: [{
            attributeName: 'category',
            displayName: 'Category',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }]
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should reject invalid minItems (negative)', async () => {
        const invalidAttribute = {
          attributeName: 'items',
          displayName: 'Items',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          minItems: -1,
          items: [{
            attributeName: 'item',
            displayName: 'Item',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }]
        };

        const attributeDto = plainToClass(W3CAttributeValue, invalidAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('min');
      });
    });

    describe('Object Attribute Validations', () => {
      it('should validate minProperties for object type', async () => {
        const validAttribute = {
          attributeName: 'address',
          displayName: 'Address',
          schemaDataType: W3CSchemaDataType.OBJECT,
          isRequired: true,
          minProperties: 2,
          properties: {
            street: {
              attributeName: 'street',
              displayName: 'Street',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true
            },
            city: {
              attributeName: 'city',
              displayName: 'City',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true
            }
          }
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate maxProperties for object type', async () => {
        const validAttribute = {
          attributeName: 'metadata',
          displayName: 'Metadata',
          schemaDataType: W3CSchemaDataType.OBJECT,
          isRequired: false,
          maxProperties: 5,
          properties: {
            key1: {
              attributeName: 'key1',
              displayName: 'Key 1',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: false
            }
          }
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });

      it('should validate additionalProperties for object type', async () => {
        const validAttribute = {
          attributeName: 'config',
          displayName: 'Configuration',
          schemaDataType: W3CSchemaDataType.OBJECT,
          isRequired: false,
          additionalProperties: false,
          properties: {
            setting: {
              attributeName: 'setting',
              displayName: 'Setting',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: false
            }
          }
        };

        const attributeDto = plainToClass(W3CAttributeValue, validAttribute);
        const errors = await validate(attributeDto);

        expect(errors.length).toBe(0);
      });
    });
  });

  describe('CreateW3CSchemaDto', () => {
    it('should validate a valid W3C schema', async () => {
      const validSchema = {
        attributes: [
          {
            attributeName: 'name',
            displayName: 'Full Name',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ],
        schemaName: 'Test Schema',
        description: 'A test schema for validation',
        schemaType: JSONSchemaType.POLYGON_W3C
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, validSchema);
      const errors = await validate(schemaDto);

      expect(errors.length).toBe(0);
    });

    it('should reject empty attributes array', async () => {
      const invalidSchema = {
        attributes: [],
        schemaName: 'Test Schema',
        description: 'A test schema',
        schemaType: JSONSchemaType.POLYGON_W3C
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, invalidSchema);
      const errors = await validate(schemaDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('should reject empty schemaName', async () => {
      const invalidSchema = {
        attributes: [
          {
            attributeName: 'name',
            displayName: 'Name',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ],
        schemaName: '',
        description: 'A test schema',
        schemaType: JSONSchemaType.POLYGON_W3C
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, invalidSchema);
      const errors = await validate(schemaDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject empty description', async () => {
      const invalidSchema = {
        attributes: [
          {
            attributeName: 'name',
            displayName: 'Name',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ],
        schemaName: 'Test Schema',
        description: '',
        schemaType: JSONSchemaType.POLYGON_W3C
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, invalidSchema);
      const errors = await validate(schemaDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject invalid schemaType', async () => {
      const invalidSchema = {
        attributes: [
          {
            attributeName: 'name',
            displayName: 'Name',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ],
        schemaName: 'Test Schema',
        description: 'A test schema',
        schemaType: 'INVALID_TYPE'
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, invalidSchema);
      const errors = await validate(schemaDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should trim whitespace from schemaName', async () => {
      const schemaWithWhitespace = {
        attributes: [
          {
            attributeName: 'name',
            displayName: 'Name',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ],
        schemaName: '  Test Schema  ',
        description: 'A test schema',
        schemaType: JSONSchemaType.POLYGON_W3C
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, schemaWithWhitespace);
      const errors = await validate(schemaDto);

      expect(errors.length).toBe(0);
      expect(schemaDto.schemaName).toBe('Test Schema');
    });

    it('should handle nested attribute validation errors', async () => {
      const schemaWithInvalidAttribute = {
        attributes: [
          {
            attributeName: '',  // Invalid empty name
            displayName: 'Name',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ],
        schemaName: 'Test Schema',
        description: 'A test schema',
        schemaType: JSONSchemaType.POLYGON_W3C
      };

      const schemaDto = plainToClass(CreateW3CSchemaDto, schemaWithInvalidAttribute);
      const errors = await validate(schemaDto);

      expect(errors.length).toBeGreaterThan(0);
      // Check that nested validation errors are caught
      expect(errors.some(error => error.property === 'attributes')).toBe(true);
    });
  });

  describe('GenericSchemaDTO', () => {
    it('should validate W3C schema type', async () => {
      const validGenericSchema = {
        type: SchemaTypeEnum.JSON,
        alias: 'test-alias',
        schemaPayload: {
          attributes: [
            {
              attributeName: 'name',
              displayName: 'Name',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true
            }
          ],
          schemaName: 'Test Schema',
          description: 'A test schema',
          schemaType: JSONSchemaType.POLYGON_W3C
        }
      };

      const genericDto = plainToClass(GenericSchemaDTO, validGenericSchema);
      const errors = await validate(genericDto);

      expect(errors.length).toBe(0);
    });

    it('should reject invalid type', async () => {
      const invalidGenericSchema = {
        type: 'INVALID_TYPE',
        alias: 'test-alias',
        schemaPayload: {}
      };

      const genericDto = plainToClass(GenericSchemaDTO, invalidGenericSchema);
      const errors = await validate(genericDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should require type field', async () => {
      const invalidGenericSchema = {
        alias: 'test-alias',
        schemaPayload: {}
      };

      const genericDto = plainToClass(GenericSchemaDTO, invalidGenericSchema);
      const errors = await validate(genericDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should trim alias whitespace', async () => {
      const schemaWithWhitespace = {
        type: SchemaTypeEnum.JSON,
        alias: '  test-alias  ',
        schemaPayload: {
          attributes: [
            {
              attributeName: 'name',
              displayName: 'Name',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true
            }
          ],
          schemaName: 'Test Schema',
          description: 'A test schema',
          schemaType: JSONSchemaType.POLYGON_W3C
        }
      };

      const genericDto = plainToClass(GenericSchemaDTO, schemaWithWhitespace);
      const errors = await validate(genericDto);

      expect(errors.length).toBe(0);
      expect(genericDto.alias).toBe('test-alias');
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate conditional string validations', async () => {
      const stringAttributeWithValidations = {
        attributeName: 'email',
        displayName: 'Email',
        schemaDataType: W3CSchemaDataType.STRING,
        isRequired: true,
        minLength: 5,
        maxLength: 100,
        pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
      };

      const attributeDto = plainToClass(W3CAttributeValue, stringAttributeWithValidations);
      const errors = await validate(attributeDto);

      expect(errors.length).toBe(0);
    });

    it('should validate conditional number validations', async () => {
      const numberAttributeWithValidations = {
        attributeName: 'score',
        displayName: 'Score',
        schemaDataType: W3CSchemaDataType.NUMBER,
        isRequired: true,
        minimum: 0,
        maximum: 100,
        multipleOf: 0.5
      };

      const attributeDto = plainToClass(W3CAttributeValue, numberAttributeWithValidations);
      const errors = await validate(attributeDto);

      expect(errors.length).toBe(0);
    });

    it('should validate conditional array validations', async () => {
      const arrayAttributeWithValidations = {
        attributeName: 'items',
        displayName: 'Items',
        schemaDataType: W3CSchemaDataType.ARRAY,
        isRequired: false,
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: [{
          attributeName: 'item',
          displayName: 'Item',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true
        }]
      };

      const attributeDto = plainToClass(W3CAttributeValue, arrayAttributeWithValidations);
      const errors = await validate(attributeDto);

      expect(errors.length).toBe(0);
    });
  });
});
