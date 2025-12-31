/* eslint-disable camelcase */
import { Controller } from '@nestjs/common';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import { IssuerCreation, IssuerUpdation } from '../interfaces/oid4vc-issuance.interfaces';
import { MessagePattern } from '@nestjs/microservices';
import { user, oidc_issuer, credential_templates } from '@prisma/client';
import {
  CreateOidcCredentialOffer,
  UpdateCredentialRequest,
  GetAllCredentialOffer
} from '../interfaces/oid4vc-issuer-sessions.interfaces';
import { CreateCredentialTemplate, UpdateCredentialTemplate } from '../interfaces/oid4vc-template.interfaces';
import { Oid4vcCredentialOfferWebhookPayload } from '../interfaces/oid4vc-wh-interfaces';

@Controller()
export class Oid4vcIssuanceController {
  constructor(private readonly oid4vcIssuanceService: Oid4vcIssuanceService) {}

  @MessagePattern({ cmd: 'oid4vc-issuer-create' })
  async oidcIssuerCreate(payload: {
    issueCredentialDto: IssuerCreation;
    orgId: string;
    userDetails: user;
  }): Promise<oidc_issuer> {
    const { issueCredentialDto, orgId, userDetails } = payload;
    return this.oid4vcIssuanceService.oidcIssuerCreate(issueCredentialDto, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oid4vc-issuer-update' })
  async oidcIssuerUpdate(payload: {
    issueUpdationDto: IssuerUpdation;
    orgId: string;
    userDetails: user;
  }): Promise<oidc_issuer> {
    const { issueUpdationDto, orgId, userDetails } = payload;
    return this.oid4vcIssuanceService.oidcIssuerUpdate(issueUpdationDto, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oid4vc-issuer-get-by-id' })
  async oidcGetIssuerById(payload: {
    id: string;
    orgId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { id, orgId } = payload;
    return this.oid4vcIssuanceService.oidcIssuerGetById(id, orgId);
  }

  @MessagePattern({ cmd: 'oid4vc-get-issuers-issuance' })
  async oidcGetIssuers(payload: { orgId: string }): Promise<oidc_issuer[]> {
    const { orgId } = payload;
    return this.oid4vcIssuanceService.oidcIssuers(orgId);
  }

  @MessagePattern({ cmd: 'oid4vc-delete-issuer' })
  async deleteOidcIssuer(payload: {
    orgId: string;
    userDetails: user;
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { orgId, userDetails, id } = payload;
    return this.oid4vcIssuanceService.deleteOidcIssuer(orgId, userDetails, id);
  }

  @MessagePattern({ cmd: 'oid4vc-template-create' })
  async oidcTemplateCreate(payload: {
    credentialTemplate: CreateCredentialTemplate;
    orgId: string;
    issuerId: string;
  }): Promise<credential_templates> {
    const { credentialTemplate, orgId, issuerId } = payload;
    return this.oid4vcIssuanceService.createTemplate(credentialTemplate, orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oid4vc-template-update' })
  async oidcTemplateUpdate(payload: {
    templateId: string;
    dto: UpdateCredentialTemplate;
    orgId: string;
    issuerId: string;
  }): Promise<credential_templates> {
    const { templateId, dto, orgId, issuerId } = payload;
    return this.oid4vcIssuanceService.updateTemplate(templateId, dto, orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oid4vc-template-delete' })
  async oidcTemplateDelete(payload: {
    templateId: string;
    orgId: string;
    userDetails: user;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { templateId, orgId, userDetails, issuerId } = payload;
    return this.oid4vcIssuanceService.deleteTemplate(templateId, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oid4vc-template-find-id' })
  async oidcTemplateFindById(payload: { templateId: string; orgId: string }): Promise<credential_templates | null> {
    const { templateId, orgId } = payload;
    return this.oid4vcIssuanceService.findByIdTemplate(templateId, orgId);
  }

  @MessagePattern({ cmd: 'oid4vc-template-find-all' })
  async oidcTemplateFindAll(payload: { orgId: string; issuerId: string }): Promise<credential_templates[]> {
    const { orgId, issuerId } = payload;
    return this.oid4vcIssuanceService.findAllTemplate(orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oid4vc-create-credential-offer' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOidcCredentialOffer(payload: {
    oidcCredentialPayload: CreateOidcCredentialOffer;
    orgId: string;
    userDetails: user;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { oidcCredentialPayload, orgId, userDetails, issuerId } = payload;
    return this.oid4vcIssuanceService.createOidcCredentialOffer(oidcCredentialPayload, orgId, userDetails, issuerId);
  }

  @MessagePattern({ cmd: 'oid4vc-create-credential-offer-D2A' })
  async createOidcCredentialOfferD2A(payload: {
    oidcCredentialD2APayload;
    orgId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { oidcCredentialD2APayload, orgId } = payload;
    return this.oid4vcIssuanceService.createOidcCredentialOfferD2A(oidcCredentialD2APayload, orgId);
  }

  @MessagePattern({ cmd: 'oid4vc-update-credential-offer' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateOidcCredentialOffer(payload: {
    oidcUpdateCredentialPayload: UpdateCredentialRequest;
    orgId: string;
    issuerId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { oidcUpdateCredentialPayload, orgId, issuerId } = payload;
    return this.oid4vcIssuanceService.updateOidcCredentialOffer(oidcUpdateCredentialPayload, orgId, issuerId);
  }

  @MessagePattern({ cmd: 'oid4vc-credential-offer-get-by-id' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCredentialOfferDetailsById(payload: {
    offerId: string;
    orgId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { offerId, orgId } = payload;
    return this.oid4vcIssuanceService.getCredentialOfferDetailsById(offerId, orgId);
  }
  @MessagePattern({ cmd: 'oid4vc-credential-offer-get-all' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllCredentialOffers(payload: {
    orgId: string;
    getAllCredentialOffer: GetAllCredentialOffer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { orgId, getAllCredentialOffer } = payload;
    return this.oid4vcIssuanceService.getCredentialOffers(orgId, getAllCredentialOffer);
  }

  @MessagePattern({ cmd: 'oid4vc-credential-offer-delete' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteCredentialOffers(payload: {
    orgId: string;
    credentialId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { orgId, credentialId } = payload;
    return this.oid4vcIssuanceService.deleteCredentialOffers(orgId, credentialId);
  }

  @MessagePattern({ cmd: 'webhook-oid4vc-issue-credential' })
  async oidcIssueCredentialWebhook(payload: Oid4vcCredentialOfferWebhookPayload): Promise<object> {
    return this.oid4vcIssuanceService.storeOidcCredentialWebhook(payload);
  }
}
