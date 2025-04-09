import { IW3CAttributeValue } from '@credebl/common/interfaces/interface';
import { ISchemaAttributesFormat } from 'apps/ledger/src/schema/interfaces/schema-payload.interface';
import { IProductSchema } from 'apps/ledger/src/schema/interfaces/schema.interface';
import ExclusiveMinimum from 'libs/validations/exclusiveMinimum';
import MaxItems from 'libs/validations/maxItems';
import MaxLength from 'libs/validations/maxLength';
import Minimum from 'libs/validations/minimum';
import MinItems from 'libs/validations/minItems';
import MinLength from 'libs/validations/minLength';
import MultipleOf from 'libs/validations/multipleOf';
import Pattern from 'libs/validations/pattern';
import UniqueItems from 'libs/validations/uniqueItems';

export function w3cSchemaBuilder(attributes: IW3CAttributeValue[], schemaName: string, description: string): object {
  // Function to apply validations based on attribute properties
  const applyValidations = (attribute, propertyObj): ISchemaAttributesFormat => {
    const context = { ...propertyObj };

    // Apply string validations
    if ('string' === attribute.schemaDataType.toLowerCase()) {
      if (attribute.minLength !== undefined) {
        const validation = new MinLength(attribute.minLength);
        validation.json(context);
      }

      if (attribute.maxLength !== undefined) {
        const validation = new MaxLength(attribute.maxLength);
        validation.json(context);
      }

      if (attribute.pattern !== undefined) {
        const validation = new Pattern(attribute.pattern);
        validation.json(context);
      }
    }

    // Apply number validations
    if (['number', 'integer'].includes(attribute.schemaDataType.toLowerCase())) {
      if (attribute.minimum !== undefined) {
        const validation = new Minimum(attribute.minimum);
        validation.json(context);
      }

      if (attribute.exclusiveMinimum !== undefined) {
        const validation = new ExclusiveMinimum(attribute.exclusiveMinimum);
        validation.json(context);
      }

      if (attribute.multipleOf !== undefined) {
        const validation = new MultipleOf(attribute.multipleOf);
        validation.json(context);
      }
    }

    // Apply array validations
    if ('array' === attribute.schemaDataType.toLowerCase()) {
      if (attribute.minItems !== undefined) {
        const validation = new MinItems(attribute.minItems);
        validation.json(context);
      }

      if (attribute.maxItems !== undefined) {
        const validation = new MaxItems(attribute.maxItems);
        validation.json(context);
      }

      if (attribute.uniqueItems !== undefined) {
        const validation = new UniqueItems(attribute.uniqueItems);
        validation.json(context);
      }
    }

    return context;
  };

  // Function to recursively process attributes
  const processAttributes = (attrs: IW3CAttributeValue[]): IProductSchema => {
    if (!Array.isArray(attrs)) {
      return { properties: {}, required: [] };
    }

    const properties = {};
    const required = [];

    attrs.forEach((attribute) => {
      const { attributeName, schemaDataType, isRequired, displayName, description } = attribute;

      // Add to required array if isRequired is true
      if (isRequired) {
        required.push(attributeName);
      }

      // Create base property object with common fields
      const baseProperty = {
        type: schemaDataType.toLowerCase(),
        title: displayName || attributeName,
        description: description ? description : `${attributeName} field`
      };

      // Handle different attribute types
      if (['string', 'number', 'boolean', 'integer'].includes(schemaDataType.toLowerCase())) {
        // Apply validations to the base property
        properties[attributeName] = applyValidations(attribute, baseProperty);
      } else if ('datetime-local' === schemaDataType.toLowerCase()) {
        properties[attributeName] = {
          ...baseProperty,
          type: 'string',
          format: 'date-time'
        };
      } else if ('array' === schemaDataType.toLowerCase() && attribute.items) {
        // Process array items
        const arrayItemProperties = {};
        const arrayItemRequired = [];

        if (Array.isArray(attribute.items)) {
          // If items is an array, process each item
          attribute.items.forEach((item) => {
            if ('object' === item.schemaDataType.toLowerCase() && item.properties) {
              // Process object properties
              const nestedObjProperties = {};
              const nestedObjRequired = [];

              // Process properties object
              Object.keys(item.properties).forEach((propKey) => {
                const prop = item.properties[propKey];

                if (prop.isRequired) {
                  nestedObjRequired.push(prop.attributeName);
                }

                if ('array' === prop.schemaDataType.toLowerCase() && prop.items) {
                  // Handle nested array
                  const nestedArrayResult = processAttributes(prop.items);

                  nestedObjProperties[prop.attributeName] = {
                    type: prop.schemaDataType.toLowerCase(),
                    title: prop.displayName || prop.attributeName,
                    description: `${prop.attributeName} field`,
                    items: {
                      type: 'object',
                      properties: nestedArrayResult.properties
                    }
                  };

                  if (0 < nestedArrayResult.required.length) {
                    nestedObjProperties[prop.attributeName].items.required = nestedArrayResult.required;
                  }
                } else {
                  // Handle basic property
                  nestedObjProperties[prop.attributeName] = {
                    type: prop.schemaDataType.toLowerCase(),
                    title: prop.displayName || prop.attributeName,
                    description: `${prop.attributeName} field`
                  };

                  // Apply validations
                  nestedObjProperties[prop.attributeName] = applyValidations(
                    prop,
                    nestedObjProperties[prop.attributeName]
                  );
                }
              });

              // Add object to array item properties
              arrayItemProperties[item.attributeName] = {
                type: 'object',
                title: item.displayName || item.attributeName,
                description: `${item.attributeName} field`,
                properties: nestedObjProperties
              };

              if (0 < nestedObjRequired.length) {
                arrayItemProperties[item.attributeName].required = nestedObjRequired;
              }

              if (item.isRequired) {
                arrayItemRequired.push(item.attributeName);
              }
            } else {
              // Handle basic array item
              arrayItemProperties[item.attributeName] = {
                type: item.schemaDataType.toLowerCase(),
                title: item.displayName || item.attributeName,
                description: `${item.attributeName} field`
              };

              // Apply validations
              arrayItemProperties[item.attributeName] = applyValidations(item, arrayItemProperties[item.attributeName]);

              if (item.isRequired) {
                arrayItemRequired.push(item.attributeName);
              }
            }
          });
        }

        properties[attributeName] = {
          ...baseProperty,
          items: {
            type: 'object',
            properties: arrayItemProperties
          }
        };

        // Apply array-specific validations
        properties[attributeName] = applyValidations(attribute, properties[attributeName]);

        // Add required properties to the items schema if any
        if (0 < arrayItemRequired.length) {
          properties[attributeName].items.required = arrayItemRequired;
        }
      } else if ('object' === schemaDataType.toLowerCase() && attribute.properties) {
        const nestedProperties = {};
        const nestedRequired = [];

        // Process each property in the object
        Object.keys(attribute.properties).forEach((propKey) => {
          const prop = attribute.properties[propKey];

          // Add to nested required array if isRequired is true
          if (prop.isRequired) {
            nestedRequired.push(propKey);
          }

          // Create base property for nested object
          const nestedBaseProperty = {
            type: prop.schemaDataType.toLowerCase(),
            title: prop.displayName || prop.attributeName,
            description: `${prop.attributeName} field`
          };

          if ('array' === prop.schemaDataType.toLowerCase() && prop.items) {
            // Handle nested arrays
            const result = processAttributes(prop.items);

            nestedProperties[prop.attributeName] = {
              ...nestedBaseProperty,
              type: 'array',
              items: {
                type: 'object',
                properties: result.properties
              }
            };

            // Apply array-specific validations
            nestedProperties[prop.attributeName] = applyValidations(prop, nestedProperties[prop.attributeName]);

            // Add required properties to the items schema if any
            if (0 < result.required.length) {
              nestedProperties[prop.attributeName].items.required = result.required;
            }
          } else {
            // Handle basic properties with validations
            nestedProperties[prop.attributeName] = applyValidations(prop, nestedBaseProperty);
          }
        });

        properties[attributeName] = {
          ...baseProperty,
          type: 'object',
          properties: nestedProperties
        };

        // Add required properties to the object schema if any
        if (0 < nestedRequired.length) {
          properties[attributeName].required = nestedRequired;
        }
      }
    });

    return { properties, required };
  };

  // Process all attributes
  const result = processAttributes(attributes);
  const { properties } = result;
  // Add id property to required fields along with other required fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const required = ['id', ...result.required];

  // Add id property
  properties['id'] = {
    type: 'string',
    format: 'uri'
  };

  // Create the final W3C Schema
  const W3CSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://example.com/schemas/${schemaName.toLowerCase().replace(/\s+/g, '-')}`,
    title: schemaName,
    description,
    type: 'object',
    required: ['@context', 'issuer', 'issuanceDate', 'type', 'credentialSubject'],
    properties: {
      '@context': {
        $ref: '#/$defs/context'
      },
      type: {
        type: 'array',
        items: {
          anyOf: [
            {
              const: 'VerifiableCredential'
            },
            {
              const: schemaName
            }
          ]
        }
      },
      credentialSubject: {
        $ref: '#/$defs/credentialSubject'
      },
      id: {
        type: 'string',
        format: 'uri'
      },
      issuer: {
        $ref: '#/$defs/uriOrId'
      },
      issuanceDate: {
        type: 'string',
        format: 'date-time'
      },
      expirationDate: {
        type: 'string',
        format: 'date-time'
      },
      credentialStatus: {
        $ref: '#/$defs/credentialStatus'
      },
      credentialSchema: {
        $ref: '#/$defs/credentialSchema'
      }
    },
    $defs: {
      context: {
        type: 'array',
        prefixItems: [
          {
            const: 'https://www.w3.org/2018/credentials/v1'
          }
        ],
        items: {
          oneOf: [
            {
              type: 'string',
              format: 'uri'
            },
            {
              type: 'object'
            },
            {
              type: 'array',
              items: false
            }
          ]
        },
        minItems: 1,
        uniqueItems: true
      },
      credentialSubject: {
        type: 'object',
        required: ['id', ...result.required],
        additionalProperties: false,
        properties
      },
      credentialSchema: {
        oneOf: [
          {
            $ref: '#/$defs/idAndType'
          },
          {
            type: 'array',
            items: {
              $ref: '#/$defs/idAndType'
            },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      credentialStatus: {
        oneOf: [
          {
            $ref: '#/$defs/idAndType'
          },
          {
            type: 'array',
            items: {
              $ref: '#/$defs/idAndType'
            },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      idAndType: {
        type: 'object',
        required: ['id', 'type'],
        properties: {
          id: {
            type: 'string',
            format: 'uri'
          },
          type: {
            type: 'string'
          }
        }
      },
      uriOrId: {
        oneOf: [
          {
            type: 'string',
            format: 'uri'
          },
          {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                format: 'uri'
              }
            }
          }
        ]
      }
    }
  };

  return W3CSchema;
}
