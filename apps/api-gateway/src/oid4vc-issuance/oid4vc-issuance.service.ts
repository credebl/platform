import { NATSClient } from '@credebl/common/NATSClient';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IssuerCreationDto, IssuerUpdationDto } from './dtos/oid4vc-issuer.dto';
import { BaseService } from 'libs/service/base.service';
// eslint-disable-next-line camelcase
import { oidc_issuer, user } from '@prisma/client';
import { CreateCredentialTemplateDto, UpdateCredentialTemplateDto } from './dtos/oid4vc-issuer-template.dto';
import {
  CreateCredentialOfferD2ADto,
  CreateOidcCredentialOfferDto,
  GetAllCredentialOfferDto,
  UpdateCredentialRequestDto
} from './dtos/issuer-sessions.dto';
import { OidcIssueCredentialDto } from './dtos/oid4vc-credential-wh.dto';

@Injectable()
export class Oid4vcIssuanceService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('Oid4vcIssuanceService');
  }

  async oidcIssuerCreate(
    issueCredentialDto: IssuerCreationDto,
    orgId: string,
    userDetails: user
    // eslint-disable-next-line camelcase
  ): Promise<oidc_issuer> {
    const payload = { issueCredentialDto, orgId, userDetails };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-issuer-create', payload);
  }

  async oidcIssuerUpdate(issueUpdationDto: IssuerUpdationDto, orgId: string, userDetails: user): Promise<object> {
    const payload = { issueUpdationDto, orgId, userDetails };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-issuer-update', payload);
  }

  async oidcGetIssuerById(id: string, orgId: string): Promise<object> {
    const payload = { id, orgId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-issuer-get-by-id', payload);
  }

  async oidcGetIssuers(orgId: string): Promise<object> {
    const payload = { orgId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-get-issuers-issuance', payload);
  }

  async oidcDeleteIssuer(userDetails: user, orgId: string, id: string): Promise<object> {
    const payload = { id, orgId, userDetails };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-delete-issuer', payload);
  }

  async deleteTemplate(userDetails: user, orgId: string, templateId: string, issuerId: string): Promise<object> {
    const payload = { templateId, orgId, userDetails, issuerId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-template-delete', payload);
  }

  async updateTemplate(
    userDetails: user,
    orgId: string,
    templateId: string,
    dto: UpdateCredentialTemplateDto,
    issuerId: string
  ): Promise<object> {
    const payload = { templateId, orgId, userDetails, dto, issuerId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-template-update', payload);
  }

  async findByIdTemplate(orgId: string, templateId: string): Promise<object> {
    const payload = { templateId, orgId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-template-find-id', payload);
  }

  async findAllTemplate(orgId: string, issuerId: string): Promise<object> {
    const payload = { orgId, issuerId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-template-find-all', payload);
  }

  async createTemplate(
    credentialTemplate: CreateCredentialTemplateDto,
    userDetails: user,
    orgId: string,
    issuerId: string
  ): Promise<object> {
    const payload = { credentialTemplate, orgId, userDetails, issuerId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-template-create', payload);
  }

  async createOidcCredentialOffer(
    oidcCredentialPayload: CreateOidcCredentialOfferDto,
    userDetails: user,
    orgId: string,
    issuerId: string
  ): Promise<object> {
    const payload = { oidcCredentialPayload, orgId, userDetails, issuerId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-create-credential-offer', payload);
  }

  async createOidcCredentialOfferD2A(
    oidcCredentialD2APayload: CreateCredentialOfferD2ADto,
    orgId: string
  ): Promise<object> {
    const payload = { oidcCredentialD2APayload, orgId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-create-credential-offer-D2A', payload);
  }

  async updateOidcCredentialOffer(
    oidcUpdateCredentialPayload: UpdateCredentialRequestDto,
    orgId: string,
    issuerId: string
  ): Promise<object> {
    const payload = { oidcUpdateCredentialPayload, orgId, issuerId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-update-credential-offer', payload);
  }

  async getCredentialOfferDetailsById(offerId: string, orgId: string): Promise<object> {
    const payload = { offerId, orgId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-credential-offer-get-by-id', payload);
  }
  async getAllCredentialOffers(orgId: string, getAllCredentialOffer: GetAllCredentialOfferDto): Promise<object> {
    const payload = { orgId, getAllCredentialOffer };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-credential-offer-get-all', payload);
  }

  async deleteCredentialOffers(orgId: string, credentialId: string): Promise<object> {
    const payload = { orgId, credentialId };
    return this.natsClient.sendNatsMessage(this.issuanceProxy, 'oid4vc-credential-offer-delete', payload);
  }

  oidcIssueCredentialWebhook(
    oidcIssueCredentialDto: OidcIssueCredentialDto,
    id: string
  ): Promise<{
    response: object;
  }> {
    const payload = { oidcIssueCredentialDto, id };
    return this.natsClient.sendNats(this.issuanceProxy, 'webhook-oid4vc-issue-credential', payload);
  }

  async _getWebhookUrl(tenantId?: string, orgId?: string): Promise<string> {
    const pattern = { cmd: 'get-webhookurl' };
    const payload = { tenantId, orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.issuanceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _postWebhookResponse(webhookUrl: string, data: object): Promise<string> {
    const pattern = { cmd: 'post-webhook-response-to-webhook-url' };
    const payload = { webhookUrl, data };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.issuanceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);

      throw error;
    }
  }
}
