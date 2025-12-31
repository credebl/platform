import { NATSClient } from '@credebl/common/NATSClient';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
// eslint-disable-next-line camelcase
import { oid4vp_verifier, user } from '@prisma/client';
import { CreateVerifierDto, UpdateVerifierDto } from './dtos/oid4vc-verifier.dto';
import { VerificationPresentationQueryDto } from './dtos/oid4vc-verifier-presentation.dto';
import { IPresentationRequest } from '@credebl/common/interfaces/oid4vp-verification';
import { Oid4vpPresentationWhDto } from '../oid4vc-issuance/dtos/oid4vp-presentation-wh.dto';
import { CreateVerificationTemplateDto, UpdateVerificationTemplateDto } from './dtos/verification-template.dto';
import { CreateIntentBasedVerificationDto } from './dtos/create-intent-based-verification.dto';

@Injectable()
export class Oid4vcVerificationService {
  private readonly logger = new Logger('Oid4vcVerificationService');

  constructor(
    @Inject('NATS_CLIENT') private readonly oid4vpProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {}

  async createIntentBasedVerificationPresentation(
    orgId: string,
    verifierId: string,
    createIntentDto: CreateIntentBasedVerificationDto,
    userDetails: user
  ): Promise<object> {
    const { intent, responseMode, requestSigner } = createIntentDto;
    const signerOption = requestSigner?.method;
    const payload = { orgId, verifierId, intent, responseMode, signerOption, userDetails };
    this.logger.debug(
      `[createIntentBasedVerificationPresentation] Called with orgId=${orgId}, verifierId=${verifierId}, intent=${intent}, user=${userDetails?.id}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-intent-based-verification-presentation', payload);
  }

  async oid4vpCreateVerifier(
    createVerifier: CreateVerifierDto,
    orgId: string,
    userDetails: user
    // eslint-disable-next-line camelcase
  ): Promise<oid4vp_verifier> {
    const payload = { createVerifier, orgId, userDetails };
    this.logger.debug(`[oid4vpCreateVerifier] Called with orgId=${orgId}, user=${userDetails?.id}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-create', payload);
  }

  async oid4vpUpdateVerifier(
    updateVerifier: UpdateVerifierDto,
    orgId: string,
    verifierId: string,
    userDetails: user
    // eslint-disable-next-line camelcase
  ): Promise<oid4vp_verifier> {
    const payload = { updateVerifier, orgId, verifierId, userDetails };
    this.logger.debug(
      `[oid4vpUpdateVerifier] Called with orgId=${orgId}, verifierId=${verifierId}, user=${userDetails?.id}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-update', payload);
  }

  async oid4vpGetVerifier(orgId, verifierId?: string): Promise<object> {
    const payload = { orgId, verifierId };
    this.logger.debug(`[oid4vpGetVerifier] Called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-get', payload);
  }

  async oid4vpDeleteVerifier(orgId, verifierId: string): Promise<object> {
    const payload = { orgId, verifierId };
    this.logger.debug(`[oid4vpDeleteVerifier] Called with orgId=${orgId}, verifierId=${verifierId}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-delete', payload);
  }

  async oid4vpGetVerifierSession(orgId, query?: VerificationPresentationQueryDto): Promise<object> {
    const payload = { orgId, query };
    this.logger.debug(
      `[oid4vpGetVerifierSession] Called with orgId=${orgId}, queryParams=${Object.keys(query || {}).length}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-session-get', payload);
  }
  async getVerificationSessionResponse(orgId, verificationSessionId: string): Promise<object> {
    const payload = { orgId, verificationSessionId };
    this.logger.debug(
      `[getVerificationSessionResponse] Called with orgId=${orgId}, verificationSessionId=${verificationSessionId}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verifier-session-response-get', payload);
  }

  async oid4vpCreateVerificationSession(
    sessionRequest: IPresentationRequest,
    orgId: string,
    userDetails: user,
    verifierId?: string
  ): Promise<object> {
    const payload = { sessionRequest, orgId, verifierId, userDetails };
    this.logger.debug(
      `[oid4vpCreateVerificationSession] Called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}, user=${userDetails?.id ?? 'N/A'}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'oid4vp-verification-session-create', payload);
  }

  oid4vpPresentationWebhook(
    oid4vpPresentationWhDto: Oid4vpPresentationWhDto,
    id: string
  ): Promise<{
    response: object;
  }> {
    const payload = { oid4vpPresentationWhDto, id };
    return this.natsClient.sendNats(this.oid4vpProxy, 'webhook-oid4vp-presentation', payload);
  }

  async _getWebhookUrl(tenantId?: string, orgId?: string): Promise<string> {
    const pattern = { cmd: 'get-webhookurl' };
    const payload = { tenantId, orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.oid4vpProxy.send<any>(pattern, payload).toPromise();
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
      const message = await this.oid4vpProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);

      throw error;
    }
  }

  async createVerificationTemplate(
    createTemplateDto: CreateVerificationTemplateDto,
    orgId: string,
    userDetails: user
  ): Promise<object> {
    const payload = { createTemplateDto, orgId, userDetails };
    this.logger.debug(
      `[createVerificationTemplate] Called with orgId=${orgId}, user=${userDetails?.id}, createTemplateDto=${createTemplateDto}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'verification-template-create', payload);
  }

  async getVerificationTemplates(orgId: string, templateId?: string): Promise<object> {
    const payload = { orgId, templateId };
    this.logger.debug(`[getVerificationTemplates] Called with orgId=${orgId}, templateId=${templateId ?? 'N/A'}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'verification-template-get', payload);
  }

  async updateVerificationTemplate(
    templateId: string,
    updateTemplateDto: UpdateVerificationTemplateDto,
    orgId: string,
    userDetails: user
  ): Promise<object> {
    const payload = { templateId, updateCredentialTemplate: updateTemplateDto, orgId, userDetails };
    this.logger.debug(
      `[updateVerificationTemplate] Called with orgId=${orgId}, templateId=${templateId}, user=${userDetails?.id}`
    );
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'verification-template-update', payload);
  }

  async deleteVerificationTemplate(orgId: string, templateId: string): Promise<object> {
    const payload = { orgId, templateId };
    this.logger.debug(`[deleteVerificationTemplate] Called with orgId=${orgId}, templateId=${templateId}`);
    return this.natsClient.sendNatsMessage(this.oid4vpProxy, 'verification-template-delete', payload);
  }
}
