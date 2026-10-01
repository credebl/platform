import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetWebhookDto } from './get-webhoook-dto';

describe('GetWebhookDto', () => {
  it('should pass validation when orgId and tenantId are valid UUIDs', async () => {
    const dto = plainToInstance(GetWebhookDto, {
      orgId: '2a041d6e-d24c-4ed9-b011-1cfc371a8b8e',
      tenantId: '3a041d6e-d24c-4ed9-b011-1cfc371a8b8e'
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation when orgId has leading/trailing spaces around a valid UUID', async () => {
    const dto = plainToInstance(GetWebhookDto, {
      orgId: '  2a041d6e-d24c-4ed9-b011-1cfc371a8b8e  '
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.orgId).toBe('2a041d6e-d24c-4ed9-b011-1cfc371a8b8e');
  });

  it('should pass validation when fields are omitted (optional)', async () => {
    const dto = plainToInstance(GetWebhookDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when orgId is not a valid UUID', async () => {
    const dto = plainToInstance(GetWebhookDto, {
      orgId: 'invalid-org-id'
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const orgIdError = errors.find((error) => 'orgId' === error.property);
    expect(orgIdError?.constraints?.isUuid).toBe('Please provide valid orgId');
  });

  it('should fail validation when orgId with spaces is an invalid UUID', async () => {
    const dto = plainToInstance(GetWebhookDto, {
      orgId: '   invalid-org-id   '
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const orgIdError = errors.find((error) => 'orgId' === error.property);
    expect(orgIdError?.constraints?.isUuid).toBe('Please provide valid orgId');
  });

  it('should fail validation when tenantId is not a valid UUID', async () => {
    const dto = plainToInstance(GetWebhookDto, {
      tenantId: 'invalid-tenant-id'
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const tenantIdError = errors.find((error) => 'tenantId' === error.property);
    expect(tenantIdError?.constraints?.isUuid).toBe('Please provide valid tenantId');
  });
});
