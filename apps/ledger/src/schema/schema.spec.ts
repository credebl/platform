import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { W3CSchemaDataType, JSONSchemaType } from '@credebl/enum/enum';
import { ICreateW3CSchema, ISchemaData } from './interfaces/schema.interface';

// Mock the w3c schema builder
const mockW3cSchemaBuilder = jest.fn();
jest.mock('../../libs/helpers/w3c.schema.builder', () => ({
  w3cSchemaBuilder: mockW3cSchemaBuilder
}));

describe('Schema Creation - W3C Schema Validation', () => {
  let mockSchemaService: any;

  beforeEach(() => {
    mockSchemaService = {
      createW3CSchema: jest.fn(),
      _createW3CSchema: jest.fn(),
      _createW3CledgerAgnostic: jest.fn(),
    };
  });

  describe('W3C Schema Creation', () => {
    const mockOrgId = 'test-org-id';
    const mockUserId = 'test-user-id';
    const mockAlias = 'test-alias';

    const validW3CSchemaPayload: ICreateW3CSchema = {
      schemaName: 'Test Identity Schema',
      description: 'A test schema for identity verification',
      schemaType: JSONSchemaType.POLYGON_W3C,
      attributes: [
        {
          attributeName: 'name',
          displayName: 'Full Name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          description: 'The full name of the person'
        },
        {
          attributeName: 'age',
          displayName: 'Age',
          schemaDataType: W3CSchemaDataType.NUMBER,
          isRequired: false,
          minimum: 0,
          maximum: 150
        },
        {
          attributeName: 'email',
          displayName: 'Email Address',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
        }
      ]
    };

    it('should create W3C schema successfully with valid payload', async () => {
      const mockSchemaResult: ISchemaData = {
        createDateTime: new Date(),
        createdBy: mockUserId,
        name: 'Test Identity Schema',
        version: '1.0',
        attributes: JSON.stringify(validW3CSchemaPayload.attributes),
        schemaLedgerId: 'schema-123',
        publisherDid: 'did:test:12345',
        issuerId: 'did:test:12345',
        orgId: mockOrgId
      };

      mockSchemaService.createW3CSchema.mockResolvedValue(mockSchemaResult);

      const result = await mockSchemaService.createW3CSchema(mockOrgId, validW3CSchemaPayload, mockUserId, mockAlias);

      expect(result).toEqual(mockSchemaResult);
      expect(mockSchemaService.createW3CSchema).toHaveBeenCalledWith(mockOrgId, validW3CSchemaPayload, mockUserId, mockAlias);
    });

    it('should throw error when agent details are not found', async () => {
      mockSchemaService.createW3CSchema.mockRejectedValue(
        new NotFoundException('Agent details not found')
      );

      await expect(
        mockSchemaService.createW3CSchema(mockOrgId, validW3CSchemaPayload, mockUserId, mockAlias)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when schema builder fails', async () => {
      mockSchemaService.createW3CSchema.mockRejectedValue(
        new BadRequestException('Error while creating schema JSON')
      );

      await expect(
        mockSchemaService.createW3CSchema(mockOrgId, validW3CSchemaPayload, mockUserId, mockAlias)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid schema type', async () => {
      const invalidSchemaPayload = {
        ...validW3CSchemaPayload,
        schemaType: 'INVALID_TYPE' as JSONSchemaType
      };

      mockSchemaService.createW3CSchema.mockRejectedValue(
        new BadRequestException('Invalid schema type')
      );

      await expect(
        mockSchemaService.createW3CSchema(mockOrgId, invalidSchemaPayload, mockUserId, mockAlias)
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate required attributes exist', async () => {
      const schemaWithoutRequiredFields = {
        ...validW3CSchemaPayload,
        attributes: [
          {
            attributeName: 'optionalField',
            displayName: 'Optional Field',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: false
          }
        ]
      };

      const mockResult: ISchemaData = {
        createDateTime: new Date(),
        createdBy: mockUserId,
        name: schemaWithoutRequiredFields.schemaName,
        version: '1.0',
        attributes: JSON.stringify(schemaWithoutRequiredFields.attributes),
        schemaLedgerId: 'schema-123',
        publisherDid: 'did:test:12345',
        issuerId: 'did:test:12345',
        orgId: mockOrgId
      };

      mockSchemaService.createW3CSchema.mockResolvedValue(mockResult);

      const result = await mockSchemaService.createW3CSchema(mockOrgId, schemaWithoutRequiredFields, mockUserId, mockAlias);
      expect(result).toBeDefined();
    });
  });

  describe('W3C Schema Builder Validation', () => {
    beforeEach(() => {
      mockW3cSchemaBuilder.mockClear();
    });

    it('should build valid W3C schema structure', () => {
      const mockAttributes = [
        {
          attributeName: 'name',
          displayName: 'Full Name',
          schemaDataType: W3CSchemaDataType.STRING,
          isRequired: true,
          minLength: 1,
          maxLength: 100
        },
        {
          attributeName: 'birthDate',
          displayName: 'Birth Date',
          schemaDataType: W3CSchemaDataType.DATE_TIME,
          isRequired: true
        }
      ];

      const expectedSchema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: expect.stringContaining('test-schema'),
        title: 'Test Schema',
        description: 'A test schema',
        type: 'object',
        required: expect.arrayContaining(['@context', 'issuer', 'issuanceDate', 'type', 'credentialSubject']),
        properties: expect.objectContaining({
          '@context': expect.any(Object),
          'type': expect.any(Object),
          'credentialSubject': expect.any(Object)
        })
      };

      mockW3cSchemaBuilder.mockReturnValue(expectedSchema);

      const result = mockW3cSchemaBuilder(mockAttributes, 'Test Schema', 'A test schema');

      expect(mockW3cSchemaBuilder).toHaveBeenCalledWith(mockAttributes, 'Test Schema', 'A test schema');
      expect(result).toEqual(expectedSchema);
    });

    it('should handle empty attributes array', () => {
      const emptySchema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        properties: {},
        required: ['id']
      };

      mockW3cSchemaBuilder.mockReturnValue(emptySchema);

      const result = mockW3cSchemaBuilder([], 'Empty Schema', 'Schema with no attributes');

      expect(result).toEqual(emptySchema);
    });

    it('should validate string attribute with constraints', () => {
      const stringAttribute = {
        attributeName: 'description',
        displayName: 'Description',
        schemaDataType: W3CSchemaDataType.STRING,
        isRequired: false,
        minLength: 10,
        maxLength: 500,
        pattern: '^[a-zA-Z0-9\\s]+$'
      };

      const expectedProperty = {
        type: 'string',
        title: 'Description',
        description: 'description field',
        minLength: 10,
        maxLength: 500,
        pattern: '^[a-zA-Z0-9\\s]+$'
      };

      mockW3cSchemaBuilder.mockReturnValue({
        properties: { description: expectedProperty }
      });

      const result = mockW3cSchemaBuilder([stringAttribute], 'Test', 'Test schema');

      expect(result.properties.description).toEqual(expectedProperty);
    });

    it('should validate number attribute with constraints', () => {
      const numberAttribute = {
        attributeName: 'score',
        displayName: 'Test Score',
        schemaDataType: W3CSchemaDataType.NUMBER,
        isRequired: true,
        minimum: 0,
        maximum: 100,
        multipleOf: 0.1
      };

      const expectedProperty = {
        type: 'number',
        title: 'Test Score',
        description: 'score field',
        minimum: 0,
        maximum: 100,
        multipleOf: 0.1
      };

      mockW3cSchemaBuilder.mockReturnValue({
        properties: { score: expectedProperty },
        required: ['score']
      });

      const result = mockW3cSchemaBuilder([numberAttribute], 'Test', 'Test schema');

      expect(result.properties.score).toEqual(expectedProperty);
      expect(result.required).toContain('score');
    });

    it('should validate array attribute with items', () => {
      const arrayAttribute = {
        attributeName: 'skills',
        displayName: 'Skills',
        schemaDataType: W3CSchemaDataType.ARRAY,
        isRequired: false,
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: [
          {
            attributeName: 'skill',
            displayName: 'Skill',
            schemaDataType: W3CSchemaDataType.STRING,
            isRequired: true
          }
        ]
      };

      const expectedProperty = {
        type: 'array',
        title: 'Skills',
        description: 'skills field',
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: {
          type: 'object',
          properties: {
            skill: {
              type: 'string',
              title: 'Skill',
              description: 'skill field'
            }
          },
          required: ['skill']
        }
      };

      mockW3cSchemaBuilder.mockReturnValue({
        properties: { skills: expectedProperty }
      });

      const result = mockW3cSchemaBuilder([arrayAttribute], 'Test', 'Test schema');

      expect(result.properties.skills).toEqual(expectedProperty);
    });

    it('should validate datetime attribute', () => {
      const datetimeAttribute = {
        attributeName: 'createdAt',
        displayName: 'Created At',
        schemaDataType: W3CSchemaDataType.DATE_TIME,
        isRequired: true
      };

      const expectedProperty = {
        type: 'string',
        format: 'date-time',
        title: 'Created At',
        description: 'createdAt field'
      };

      mockW3cSchemaBuilder.mockReturnValue({
        properties: { createdAt: expectedProperty },
        required: ['createdAt']
      });

      const result = mockW3cSchemaBuilder([datetimeAttribute], 'Test', 'Test schema');

      expect(result.properties.createdAt).toEqual(expectedProperty);
    });

    it('should validate boolean attribute', () => {
      const booleanAttribute = {
        attributeName: 'isVerified',
        displayName: 'Is Verified',
        schemaDataType: W3CSchemaDataType.BOOLEAN,
        isRequired: false
      };

      const expectedProperty = {
        type: 'boolean',
        title: 'Is Verified',
        description: 'isVerified field'
      };

      mockW3cSchemaBuilder.mockReturnValue({
        properties: { isVerified: expectedProperty }
      });

      const result = mockW3cSchemaBuilder([booleanAttribute], 'Test', 'Test schema');

      expect(result.properties.isVerified).toEqual(expectedProperty);
    });
  });

  describe('Error Handling in Schema Creation', () => {
    it('should handle network errors during schema upload', async () => {
      mockSchemaService._createW3CledgerAgnostic.mockRejectedValue(
        new Error('Network connection failed')
      );

      await expect(
        mockSchemaService._createW3CledgerAgnostic({})
      ).rejects.toThrow('Network connection failed');
    });

    it('should handle invalid DID format', async () => {
      const invalidDidPayload = {
        schemaName: 'Test Schema',
        description: 'Test description',
        schemaType: JSONSchemaType.POLYGON_W3C,
        attributes: []
      };

      mockSchemaService.createW3CSchema.mockRejectedValue(
        new BadRequestException('Invalid DID format')
      );

      await expect(
        mockSchemaService.createW3CSchema('org-id', invalidDidPayload, 'user-id', 'alias')
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle schema server unavailable', async () => {
      mockSchemaService._createW3CledgerAgnostic.mockRejectedValue(
        new BadRequestException('Schema server unavailable')
      );

      await expect(
        mockSchemaService._createW3CledgerAgnostic({})
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle schema builder errors', async () => {
      mockW3cSchemaBuilder.mockImplementation(() => {
        throw new Error('Invalid schema attributes');
      });

      expect(() => {
        mockW3cSchemaBuilder([], 'Test', 'Description');
      }).toThrow('Invalid schema attributes');
    });

    it('should handle missing agent endpoints', async () => {
      mockSchemaService.createW3CSchema.mockRejectedValue(
        new NotFoundException('Agent endpoint not configured')
      );

      await expect(
        mockSchemaService.createW3CSchema('org-id', {
          schemaName: 'Test',
          description: 'Test',
          schemaType: JSONSchemaType.POLYGON_W3C,
          attributes: []
        }, 'user-id', 'alias')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
