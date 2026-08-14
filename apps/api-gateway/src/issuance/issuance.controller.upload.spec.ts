import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import * as request from 'supertest';

import { IssuanceController } from './issuance.controller';
import { IssuanceService } from './issuance.service';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { StorageService } from '@credebl/storage';

describe('IssuanceController — multipart upload (form-data / multer)', () => {
  const uploadCSVTemplate = jest
    .fn()
    .mockResolvedValue({ response: { fileId: '00000000-0000-4000-8000-000000000001' } });
  const uploadCsvFile = jest.fn().mockResolvedValue(undefined);
  const orgId = '11111111-1111-4111-8111-111111111111';
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [IssuanceController],
      providers: [
        { provide: IssuanceService, useValue: { uploadCSVTemplate } },
        { provide: StorageService, useValue: { uploadCsvFile } }
      ]
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses a real multipart file upload and returns the uploaded details', async () => {
    const response = await request(app.getHttpServer())
      .post(`/orgs/${orgId}/bulk/upload?schemaType=INDY&templateId=tpl:test:1`)
      .attach('file', Buffer.from('a,b,c\n1,2,3\n'), { filename: 'test.csv', contentType: 'text/csv' })
      .field('fileName', 'test.csv');

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ fileId: '00000000-0000-4000-8000-000000000001' });
    expect(uploadCsvFile).toHaveBeenCalledTimes(1);
    expect(uploadCsvFile).toHaveBeenCalledWith(expect.any(String), expect.any(Buffer));
    expect(uploadCSVTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INDY', templateId: 'tpl:test:1', fileName: 'test.csv', isValidateSchema: true }),
      orgId
    );
  });
});
