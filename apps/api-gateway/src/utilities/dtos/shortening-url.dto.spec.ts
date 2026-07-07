import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UtilitiesDto } from './shortening-url.dto';

describe('UtilitiesDto', () => {
  const basePayload = {
    credentialId: 'cred-id',
    schemaId: 'schema-id',
    credDefId: 'cred-def-id',
    invitationUrl: 'https://example.com/invite'
  };

  it('should pass validation when attributes contains at least one item', async () => {
    const dto = plainToInstance(UtilitiesDto, {
      ...basePayload,
      attributes: [{ name: 'name', value: 'value' }]
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when attributes is an empty array', async () => {
    const dto = plainToInstance(UtilitiesDto, {
      ...basePayload,
      attributes: []
    });
    const errors = await validate(dto);
    const attributesError = errors.find((error) => 'attributes' === error.property);
    expect(attributesError?.constraints?.arrayNotEmpty).toBe('attributes should not be empty');
  });

  it('should fail validation when an attribute item is missing required fields', async () => {
    const dto = plainToInstance(UtilitiesDto, {
      ...basePayload,
      attributes: [{}]
    });
    const errors = await validate(dto);
    const attributesError = errors.find((error) => 'attributes' === error.property);
    expect(attributesError?.children?.length).toBeGreaterThan(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when an attribute name is not a string', async () => {
    const dto = plainToInstance(UtilitiesDto, {
      ...basePayload,
      attributes: [{ name: 123, value: 'value' }]
    });
    const errors = await validate(dto);
    const attributesError = errors.find((error) => 'attributes' === error.property);
    const nameError = attributesError?.children?.[0]?.children?.find((error) => 'name' === error.property);
    expect(nameError?.constraints?.isString).toBeDefined();
  });
});
