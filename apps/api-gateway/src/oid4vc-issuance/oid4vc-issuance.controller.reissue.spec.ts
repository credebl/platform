import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import * as request from 'supertest';

import { Oid4vcIssuanceController } from './oid4vc-issuance.controller';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';

describe('Oid4vcIssuanceController — issue an offer again', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const offerId = '33333333-3333-4333-8333-333333333333';
  const service = { reissueCredentialOffer: jest.fn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [Oid4vcIssuanceController],
      providers: [{ provide: Oid4vcIssuanceService, useValue: service }]
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new offer and returns it', async () => {
    service.reissueCredentialOffer.mockResolvedValue({ credentialOffer: 'openid-credential-offer://x' });

    const response = await request(app.getHttpServer())
      .post(`/orgs/${orgId}/oid4vc/credential-offer/${offerId}/reissue`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('OID4VC Credential offer created again successfully.');
    expect(response.body.data).toEqual({ credentialOffer: 'openid-credential-offer://x' });
    expect(service.reissueCredentialOffer).toHaveBeenCalledWith(offerId, orgId, {});
  });

  it('passes a validity on as ISO dates', async () => {
    service.reissueCredentialOffer.mockResolvedValue({});
    await request(app.getHttpServer())
      .post(`/orgs/${orgId}/oid4vc/credential-offer/${offerId}/reissue`)
      .send({ validityInfo: { validFrom: '2026-11-11T00:00:00Z', validUntil: '2026-12-11T00:00:00Z' } });

    expect(service.reissueCredentialOffer).toHaveBeenCalledWith(offerId, orgId, {
      validityInfo: { validFrom: '2026-11-11T00:00:00.000Z', validUntil: '2026-12-11T00:00:00.000Z' }
    });
  });

  it('answers 400 for a malformed offer id and for a validity that is not a date', async () => {
    const malformed = await request(app.getHttpServer())
      .post(`/orgs/${orgId}/oid4vc/credential-offer/not-a-uuid/reissue`)
      .send({});
    expect(malformed.status).toBe(400);
    expect(malformed.body.message).toBe('Invalid OID4VC credential offer ID.');

    const badDate = await request(app.getHttpServer())
      .post(`/orgs/${orgId}/oid4vc/credential-offer/${offerId}/reissue`)
      .send({ validityInfo: { validFrom: 'soon', validUntil: 'later' } });
    expect(badDate.status).toBe(400);
    expect(service.reissueCredentialOffer).not.toHaveBeenCalled();
  });
});
