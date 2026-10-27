import { IW3CAttributeValue } from '@credebl/common/interfaces/interface';
import { VC_CONTEXT_V1, VC_CONTEXT_V2 } from '@credebl/common/vc';
import { W3CSchemaDataType } from '@credebl/enum/enum';
import { w3cSchemaBuilder } from './w3c.schema.builder';

type BuiltSchema = {
  required: string[];
  properties: Record<string, unknown>;
  $defs: {
    context: {
      prefixItems: { const: string }[];
    };
  };
};

const attributes: IW3CAttributeValue[] = [
  {
    attributeName: 'degree',
    schemaDataType: W3CSchemaDataType.STRING,
    displayName: 'Degree',
    isRequired: true
  }
];

describe('w3cSchemaBuilder', () => {
  it('builds a VC 1.1 schema by default', () => {
    const schema = w3cSchemaBuilder(attributes, 'Degree', 'A degree') as BuiltSchema;

    expect(schema.required).toEqual(['@context', 'issuer', 'issuanceDate', 'type', 'credentialSubject']);
    expect(schema.$defs.context.prefixItems[0].const).toBe(VC_CONTEXT_V1);
  });

  it('builds a VC 2.0 schema without requiring issuanceDate', () => {
    const schema = w3cSchemaBuilder(attributes, 'Degree', 'A degree', 'v2') as BuiltSchema;

    expect(schema.required).toEqual(['@context', 'issuer', 'type', 'credentialSubject']);
    expect(schema.required).not.toContain('issuanceDate');
    expect(schema.$defs.context.prefixItems[0].const).toBe(VC_CONTEXT_V2);
  });

  it('keeps validFrom/validUntil available for VC 2.0 credentials', () => {
    const schema = w3cSchemaBuilder(attributes, 'Degree', 'A degree', 'v2') as BuiltSchema;

    expect(schema.properties).toHaveProperty('validFrom');
    expect(schema.properties).toHaveProperty('validUntil');
  });
});
