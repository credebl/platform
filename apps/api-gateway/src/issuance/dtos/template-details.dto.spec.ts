import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TemplateDetails } from './issuance.dto';
import { SchemaType } from '@credebl/enum/enum';

describe('TemplateDetails DTO', () => {
  it('should pass validation when templateId and schemaType are valid', async () => {
    const dto = plainToInstance(TemplateDetails, {
      templateId: 'R2Wh9dJmnvkPnzKaiiBptR:2:BulkCredentials:0.1',
      schemaType: SchemaType.INDY
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when templateId and schemaType are empty strings', async () => {
    const dto = plainToInstance(TemplateDetails, {
      templateId: '',
      schemaType: ''
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(2);

    const templateIdError = errors.find((err) => 'templateId' === err.property);
    expect(templateIdError?.constraints?.isNotEmpty).toBe('Template Id is required');

    const schemaTypeError = errors.find((err) => 'schemaType' === err.property);
    expect(schemaTypeError?.constraints?.isEnum).toBe('Schema type should be a valid');
  });

  it('should fail validation when templateId is only whitespace', async () => {
    const dto = plainToInstance(TemplateDetails, {
      templateId: '   ',
      schemaType: SchemaType.INDY
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(1);

    const templateIdError = errors.find((err) => 'templateId' === err.property);
    expect(templateIdError?.constraints?.isNotEmpty).toBe('Template Id is required');
  });

  it('should fail validation when templateId is omitted', async () => {
    const dto = plainToInstance(TemplateDetails, {
      schemaType: SchemaType.INDY
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const templateIdError = errors.find((err) => 'templateId' === err.property);
    expect(templateIdError?.constraints?.isNotEmpty).toBe('Template Id is required');
  });
});
