import { w3cSchemaBuilder } from './w3c.schema.builder';
import { W3CSchemaDataType } from '@credebl/enum/enum';

describe('W3C Schema Builder - Unit Tests', () => {
  describe('Basic Schema Structure', () => {
    it('should create valid W3C schema with minimal attributes', () => {
      const attributes = [
        {
          attributeName: 'name',
          displayName: 'Full Name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          description: 'The person full name'
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Person Schema', 'A schema for person credentials') as any;

      expect(result).toHaveProperty('$schema', 'https://json-schema.org/draft/2020-12/schema');
      expect(result).toHaveProperty('$id');
      expect(result).toHaveProperty('title', 'Person Schema');
      expect(result).toHaveProperty('description', 'A schema for person credentials');
      expect(result).toHaveProperty('type', 'object');
      expect(result).toHaveProperty('required');
      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('$defs');
    });

    it('should include required W3C credential properties', () => {
      const attributes = [
        {
          attributeName: 'testField',
          displayName: 'Test Field',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Test Schema', 'Test description') as any;

      expect(result.required).toContain('@context');
      expect(result.required).toContain('issuer');
      expect(result.required).toContain('issuanceDate');
      expect(result.required).toContain('type');
      expect(result.required).toContain('credentialSubject');

      expect(result.properties).toHaveProperty('@context');
      expect(result.properties).toHaveProperty('type');
      expect(result.properties).toHaveProperty('credentialSubject');
      expect(result.properties).toHaveProperty('issuer');
      expect(result.properties).toHaveProperty('issuanceDate');
    });

    it('should handle empty attributes array', () => {
      const result = w3cSchemaBuilder([], 'Empty Schema', 'Schema with no custom attributes') as any;

      expect(result).toHaveProperty('$schema');
      expect(result).toHaveProperty('title', 'Empty Schema');
      expect(result.required).toEqual(['@context', 'issuer', 'issuanceDate', 'type', 'credentialSubject']);
    });
  });

  describe('String Attribute Validation', () => {
    it('should apply string length constraints', () => {
      const attributes = [
        {
          attributeName: 'username',
          displayName: 'Username',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          minLength: 3,
          maxLength: 20
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'User Schema', 'User credentials') as any;
      const credentialSubject = result.$defs.credentialSubject;
      const usernameProperty = credentialSubject.properties.username;

      expect(usernameProperty).toHaveProperty('type', 'string');
      expect(usernameProperty).toHaveProperty('minLength', 3);
      expect(usernameProperty).toHaveProperty('maxLength', 20);
      expect(credentialSubject.required).toContain('username');
    });

    it('should apply string pattern validation', () => {
      const attributes = [
        {
          attributeName: 'email',
          displayName: 'Email Address',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Contact Schema', 'Contact information') as any;
      const emailProperty = result.$defs.credentialSubject.properties.email;

      expect(emailProperty).toHaveProperty('type', 'string');
      expect(emailProperty).toHaveProperty('pattern', '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
    });

    it('should apply string enum validation', () => {
      const attributes = [
        {
          attributeName: 'gender',
          displayName: 'Gender',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: false,
          enum: ['male', 'female', 'other', 'prefer-not-to-say']
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Person Schema', 'Person details') as any;
      const genderProperty = result.$defs.credentialSubject.properties.gender;

      expect(genderProperty).toHaveProperty('type', 'string');
      expect(genderProperty).toHaveProperty('enum', ['male', 'female', 'other', 'prefer-not-to-say']);
    });

    it('should apply content encoding and media type', () => {
      const attributes = [
        {
          attributeName: 'photo',
          displayName: 'Profile Photo',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: false,
          contentEncoding: 'base64',
          contentMediaType: 'image/jpeg'
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Profile Schema', 'Profile information') as any;
      const photoProperty = result.$defs.credentialSubject.properties.photo;

      expect(photoProperty).toHaveProperty('contentEncoding', 'base64');
      expect(photoProperty).toHaveProperty('contentMediaType', 'image/jpeg');
    });
  });

  describe('Number Attribute Validation', () => {
    it('should apply number range constraints', () => {
      const attributes = [
        {
          attributeName: 'age',
          displayName: 'Age',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          minimum: 0,
          maximum: 150
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Age Schema', 'Age verification') as any;
      const ageProperty = result.$defs.credentialSubject.properties.age;

      expect(ageProperty).toHaveProperty('type', 'number');
      expect(ageProperty).toHaveProperty('minimum', 0);
      expect(ageProperty).toHaveProperty('maximum', 150);
    });

    it('should apply exclusive minimum and maximum', () => {
      const attributes = [
        {
          attributeName: 'score',
          displayName: 'Test Score',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          exclusiveMinimum: 0,
          exclusiveMaximum: 100
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Score Schema', 'Test scores') as any;
      const scoreProperty = result.$defs.credentialSubject.properties.score;

      expect(scoreProperty).toHaveProperty('exclusiveMinimum', 0);
      expect(scoreProperty).toHaveProperty('exclusiveMaximum', 100);
    });

    it('should apply multipleOf constraint', () => {
      const attributes = [
        {
          attributeName: 'price',
          displayName: 'Price',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: true,
          multipleOf: 0.01
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Price Schema', 'Product pricing') as any;
      const priceProperty = result.$defs.credentialSubject.properties.price;

      expect(priceProperty).toHaveProperty('multipleOf', 0.01);
    });

    it('should handle integer type', () => {
      const attributes = [
        {
          attributeName: 'count',
          displayName: 'Item Count',
          schemaDataType: W3CSchemaDataType.INTEGER,
          isRequired: true,
          minimum: 1
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Inventory Schema', 'Inventory management') as any;
      const countProperty = result.$defs.credentialSubject.properties.count;

      expect(countProperty).toHaveProperty('type', 'integer');
      expect(countProperty).toHaveProperty('minimum', 1);
    });
  });

  describe('DateTime Attribute Validation', () => {
    it('should create datetime field with correct format', () => {
      const attributes = [
        {
          attributeName: 'birthDate',
          displayName: 'Birth Date',
          schemaDataType: W3CSchemaDataType.DATE_TIME,
          isRequired: true
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Birth Schema', 'Birth information') as any;
      const birthDateProperty = result.$defs.credentialSubject.properties.birthDate;

      expect(birthDateProperty).toHaveProperty('type', 'string');
      expect(birthDateProperty).toHaveProperty('format', 'date-time');
    });
  });

  describe('Boolean Attribute Validation', () => {
    it('should create boolean field', () => {
      const attributes = [
        {
          attributeName: 'isVerified',
          displayName: 'Verification Status',
          schemaDataType: W3CSchemaDataType.BOOLEAN,
          isRequired: false
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Verification Schema', 'Verification status') as any;
      const isVerifiedProperty = result.$defs.credentialSubject.properties.isVerified;

      expect(isVerifiedProperty).toHaveProperty('type', 'boolean');
    });
  });

  describe('Array Attribute Validation', () => {
    it('should create array with object items', () => {
      const attributes = [
        {
          attributeName: 'skills',
          displayName: 'Skills',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          minItems: 1,
          maxItems: 10,
          uniqueItems: true,
          items: [
            {
              attributeName: 'skillName',
              displayName: 'Skill Name',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true
            },
            {
              attributeName: 'level',
              displayName: 'Skill Level',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true,
              enum: ['beginner', 'intermediate', 'advanced', 'expert']
            }
          ]
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Skills Schema', 'Professional skills') as any;
      const skillsProperty = result.$defs.credentialSubject.properties.skills;

      expect(skillsProperty).toHaveProperty('type', 'array');
      expect(skillsProperty).toHaveProperty('minItems', 1);
      expect(skillsProperty).toHaveProperty('maxItems', 10);
      expect(skillsProperty).toHaveProperty('uniqueItems', true);
      expect(skillsProperty.items).toHaveProperty('type', 'object');
      expect(skillsProperty.items.properties).toHaveProperty('skillName');
      expect(skillsProperty.items.properties).toHaveProperty('level');
      expect(skillsProperty.items.required).toEqual(['skillName', 'level']);
    });

    it('should handle array without items definition', () => {
      const attributes = [
        {
          attributeName: 'tags',
          displayName: 'Tags',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          minItems: 0,
          maxItems: 5
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Tags Schema', 'Content tags') as any;
      const tagsProperty = result.$defs.credentialSubject.properties.tags;

      expect(tagsProperty).toHaveProperty('type', 'array');
      expect(tagsProperty).toHaveProperty('minItems', 0);
      expect(tagsProperty).toHaveProperty('maxItems', 5);
    });
  });

  describe('Complex Schema Validation', () => {
    it('should handle mixed attribute types', () => {
      const attributes = [
        {
          attributeName: 'personalInfo',
          displayName: 'Personal Information',
          schemaDataType: W3CSchemaDataType.OBJECT,
          isRequired: true,
          properties: {
            name: {
              attributeName: 'name',
              displayName: 'Full Name',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true,
              minLength: 2,
              maxLength: 100
            },
            age: {
              attributeName: 'age',
              displayName: 'Age',
              schemaDataType: W3CSchemaDataType.NUMBER,
              isRequired: true,
              minimum: 0,
              maximum: 150
            }
          }
        },
        {
          attributeName: 'certifications',
          displayName: 'Certifications',
          schemaDataType: W3CSchemaDataType.ARRAY,
          isRequired: false,
          items: [
            {
              attributeName: 'name',
              displayName: 'Certification Name',
              schemaDataType: W3CSchemaDataType.STRING,
              isRequired: true
            },
            {
              attributeName: 'issueDate',
              displayName: 'Issue Date',
              schemaDataType: W3CSchemaDataType.DATE_TIME,
              isRequired: true
            }
          ]
        },
        {
          attributeName: 'isActive',
          displayName: 'Active Status',
          schemaDataType: W3CSchemaDataType.BOOLEAN,
          isRequired: true
        }
      ];

      const result = w3cSchemaBuilder(attributes, 'Complex Schema', 'Complex credential schema') as any;
      const credentialSubject = result.$defs.credentialSubject;

      expect(credentialSubject.properties).toHaveProperty('personalInfo');
      expect(credentialSubject.properties).toHaveProperty('certifications');
      expect(credentialSubject.properties).toHaveProperty('isActive');
      expect(credentialSubject.required).toContain('personalInfo');
      expect(credentialSubject.required).toContain('isActive');
      expect(credentialSubject.required).not.toContain('certifications');
    });

    it('should generate valid schema ID based on schema name', () => {
      const result = w3cSchemaBuilder([], 'My Test Schema Name', 'Test description') as any;

      expect(result.$id).toContain('my-test-schema-name');
      expect(result.$id).toMatch(/^https:\/\/example\.com\/schemas\/[a-z0-9-]+$/);
    });

    it('should include proper $defs structure', () => {
      const result = w3cSchemaBuilder([], 'Test Schema', 'Test description') as any;

      expect(result.$defs).toHaveProperty('context');
      expect(result.$defs).toHaveProperty('credentialSubject');
      expect(result.$defs).toHaveProperty('credentialSchema');
      expect(result.$defs).toHaveProperty('credentialStatus');
      expect(result.$defs).toHaveProperty('idAndType');
      expect(result.$defs).toHaveProperty('uriOrId');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null or undefined attributes', () => {
      expect(() => {
        w3cSchemaBuilder(null as any, 'Test Schema', 'Test description');
      }).not.toThrow();

      expect(() => {
        w3cSchemaBuilder(undefined as any, 'Test Schema', 'Test description');
      }).not.toThrow();
    });

    it('should handle attributes with missing properties', () => {
      const incompleteAttributes = [
        {
          attributeName: 'testField',
          // Missing displayName, schemaDataType, isRequired
        } as any
      ];

      expect(() => {
        w3cSchemaBuilder(incompleteAttributes, 'Test Schema', 'Test description');
      }).not.toThrow();
    });

    it('should handle special characters in schema name', () => {
      const result = w3cSchemaBuilder([], 'Schema with Special Ch@r$!', 'Test description') as any;

      expect(result.$id).toBeDefined();
      expect(result.title).toBe('Schema with Special Ch@r$!');
    });

    it('should handle very long schema names', () => {
      const longName = 'A'.repeat(1000);
      const result = w3cSchemaBuilder([], longName, 'Test description') as any;

      expect(result.title).toBe(longName);
      expect(result.$id).toBeDefined();
    });
  });
});
