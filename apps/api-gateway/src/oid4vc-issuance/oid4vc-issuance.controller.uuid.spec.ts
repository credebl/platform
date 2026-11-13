import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import * as request from 'supertest';

import { Oid4vcIssuanceController } from './oid4vc-issuance.controller';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';

describe('Oid4vcIssuanceController — malformed ids', () => {
  const orgId = '11111111-1111-4111-8111-111111111111';
  const issuerId = '22222222-2222-4222-8222-222222222222';
  const offerId = '33333333-3333-4333-8333-333333333333';
  const service = {
    createTemplate: jest.fn().mockResolvedValue({ id: 'template' }),
    createOidcCredentialOffer: jest.fn().mockResolvedValue({ id: 'offer' }),
    deleteCredentialOffers: jest.fn().mockResolvedValue({}),
    revokeCredential: jest.fn().mockResolvedValue({})
  };
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('answers 400, not 500, when the issuer id is the public issuer name', async () => {
    const template = await request(app.getHttpServer())
      .post(`/orgs/${orgId}/oid4vc/ibdic-platform-mdoc/template`)
      .send({});
    const offer = await request(app.getHttpServer())
      .post(`/orgs/${orgId}/oid4vc/ibdic-platform-mdoc/create-offer`)
      .send({});

    expect(template.status).toBe(400);
    expect(template.body.message).toBe('Invalid OID4VC issuer ID.');
    expect(offer.status).toBe(400);
    expect(offer.body.message).toBe('Invalid OID4VC issuer ID.');
    expect(service.createTemplate).not.toHaveBeenCalled();
    expect(service.createOidcCredentialOffer).not.toHaveBeenCalled();
  });

  it('rejects a malformed organization, offer or session id', async () => {
    const http = app.getHttpServer();

    expect((await request(http).post(`/orgs/not-a-uuid/oid4vc/${issuerId}/template`).send({})).status).toBe(400);
    const deleted = await request(http).delete(`/orgs/${orgId}/oid4vc/not-a-uuid/delete-offer`);
    expect(deleted.status).toBe(400);
    expect(deleted.body.message).toBe('Invalid OID4VC credential offer ID.');
    const revoked = await request(http).post(`/orgs/${orgId}/openid4vc/issuance-sessions/not-a-uuid/revoke`);
    expect(revoked.status).toBe(400);
    expect(revoked.body.message).toBe('Invalid OID4VC issuance session ID.');
    expect(service.deleteCredentialOffers).not.toHaveBeenCalled();
    expect(service.revokeCredential).not.toHaveBeenCalled();
  });

  it('still accepts well formed ids', async () => {
    const deleted = await request(app.getHttpServer()).delete(`/orgs/${orgId}/oid4vc/${offerId}/delete-offer`);

    expect(deleted.status).not.toBe(400);
    expect(service.deleteCredentialOffers).toHaveBeenCalledWith(orgId, offerId);
  });
});
