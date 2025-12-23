import { Controller, Logger } from '@nestjs/common';
import { Oid4vpVerificationService } from './oid4vc-verification.service';
import { SignerOption, user } from '@prisma/client';
import { CreateVerifier, IPresentationRequest, UpdateVerifier } from '@credebl/common/interfaces/oid4vp-verification';
import { MessagePattern } from '@nestjs/microservices';
import { VerificationSessionQuery } from '../interfaces/oid4vp-verifier.interfaces';
import { Oid4vpPresentationWh } from '../interfaces/oid4vp-verification-sessions.interfaces';
import { CreateVerificationTemplate, UpdateVerificationTemplate } from '../interfaces/verification-template.interfaces';

@Controller()
export class Oid4vpVerificationController {
  constructor(
    private readonly oid4vpVerificationService: Oid4vpVerificationService,
    private logger: Logger
  ) {}

  @MessagePattern({ cmd: 'oid4vp-verifier-create' })
  async oid4vpCreateVerifier(payload: {
    createVerifier: CreateVerifier;
    orgId: string;
    userDetails: user;
  }): Promise<object> {
    const { createVerifier, orgId, userDetails } = payload;
    this.logger.debug(
      `[oid4vpCreateVerifier] Received 'oid4vp-verifier-create' request for orgId=${orgId}, user=${userDetails?.id}`
    );
    return this.oid4vpVerificationService.oid4vpCreateVerifier(createVerifier, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'oid4vp-verifier-update' })
  async oid4vpUpdateVerifier(payload: {
    updateVerifier: UpdateVerifier;
    orgId: string;
    verifierId: string;
    userDetails: user;
  }): Promise<object> {
    const { updateVerifier, orgId, verifierId, userDetails } = payload;
    this.logger.debug(
      `[oid4vpUpdateVerifier] Received 'oid4vp-verifier-update' for orgId=${orgId}, verifierId=${verifierId}, user=${userDetails?.id ?? 'unknown'}`
    );
    return this.oid4vpVerificationService.oid4vpUpdateVerifier(updateVerifier, orgId, verifierId, userDetails);
  }

  @MessagePattern({ cmd: 'oid4vp-verifier-get' })
  async oid4vpGetVerifier(payload: { orgId: string; verifierId?: string }): Promise<object> {
    const { orgId, verifierId } = payload;
    this.logger.debug(
      `[oid4vpGetVerifier] Received 'oid4vp-verifier-get' for orgId=${orgId}, verifierId=${verifierId ?? 'all'}`
    );
    return this.oid4vpVerificationService.getVerifierById(orgId, verifierId);
  }

  @MessagePattern({ cmd: 'oid4vp-verifier-delete' })
  async oid4vpDeleteVerifier(payload: { orgId: string; verifierId: string }): Promise<object> {
    const { orgId, verifierId } = payload;
    this.logger.debug(
      `[oid4vpDeleteVerifier]Received 'oid4vp-verifier-delete' for orgId=${orgId}, verifierId=${verifierId}`
    );
    return this.oid4vpVerificationService.deleteVerifierById(orgId, verifierId);
  }

  @MessagePattern({ cmd: 'oid4vp-verifier-session-get' })
  async oid4vpGetVerifierSession(payload: { orgId: string; query?: VerificationSessionQuery }): Promise<object> {
    const { orgId, query } = payload;
    this.logger.debug(`[oid4vpGetVerifierSession] Received 'oid4vp-verifier-session-get' for orgId=${orgId}`);
    return this.oid4vpVerificationService.getVerifierSession(orgId, query);
  }

  @MessagePattern({ cmd: 'oid4vp-verifier-session-response-get' })
  async getVerificationSessionResponse(payload: { orgId: string; verificationSessionId: string }): Promise<object> {
    const { orgId, verificationSessionId } = payload;
    this.logger.debug(
      `[getVerificationSessionResponse] Received 'oid4vp-verifier-session-response-get' for orgId=${orgId}, verificationSessionId=${verificationSessionId}`
    );
    return this.oid4vpVerificationService.getVerificationSessionResponse(orgId, verificationSessionId);
  }

  @MessagePattern({ cmd: 'oid4vp-verification-session-create' })
  // TODO: change name
  async oid4vpCreateVerificationSession(payload: {
    orgId: string;
    verifierId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionRequest: IPresentationRequest;
    userDetails: user;
  }): Promise<object> {
    const { orgId, verifierId, sessionRequest, userDetails } = payload;
    this.logger.debug(
      `[oid4vpCreateVerificationSession] Received 'oid4vp-verification-session-create' for orgId=${orgId}, verifierId=${verifierId}, user=${userDetails?.id ?? 'unknown'}`
    );
    return this.oid4vpVerificationService.oid4vpCreateVerificationSession(
      orgId,
      verifierId,
      sessionRequest,
      userDetails
    );
  }

  @MessagePattern({ cmd: 'oid4vp-intent-based-verification-presentation' })
  async createIntentBasedVerificationPresentation(payload: {
    orgId: string;
    verifierId: string;
    intent: string;
    responseMode: string;
    signerOption: SignerOption;
    userDetails: user;
  }): Promise<object> {
    const { orgId, verifierId, intent, responseMode, signerOption, userDetails } = payload;
    this.logger.debug(
      `[createIntentBasedVerificationPresentation] Received 'oid4vp-intent-based-verification-presentation' for orgId=${orgId}, verifierId=${verifierId}, intent=${intent}, user=${userDetails?.id ?? 'unknown'}`
    );
    return this.oid4vpVerificationService.createIntentBasedVerificationPresentation(
      orgId,
      verifierId,
      intent,
      responseMode,
      signerOption,
      userDetails
    );
  }

  @MessagePattern({ cmd: 'webhook-oid4vp-presentation' })
  async oid4vpPresentationWebhook(payload: {
    oid4vpPresentationWhDto: Oid4vpPresentationWh;
    id: string;
  }): Promise<object> {
    return this.oid4vpVerificationService.oid4vpPresentationWebhook(payload.oid4vpPresentationWhDto, payload.id);
  }

  @MessagePattern({ cmd: 'verification-template-create' })
  async createVerificationTemplate(payload: {
    createTemplateDto: CreateVerificationTemplate;
    orgId: string;
    userDetails: user;
  }): Promise<object> {
    const { createTemplateDto, orgId, userDetails } = payload;
    this.logger.debug(
      `[createVerificationTemplate] Received 'verification-template-create' request for orgId=${orgId}, user=${userDetails?.id}`
    );
    return this.oid4vpVerificationService.createVerificationTemplate(createTemplateDto, orgId, userDetails);
  }

  @MessagePattern({ cmd: 'verification-template-get' })
  async getVerificationTemplates(payload: { orgId: string; templateId?: string }): Promise<object> {
    const { orgId, templateId } = payload;
    this.logger.debug(
      `[getVerificationTemplates] Received 'verification-template-get' for orgId=${orgId}, templateId=${templateId ?? 'all'}`
    );
    return this.oid4vpVerificationService.getVerificationTemplates(orgId, templateId);
  }

  @MessagePattern({ cmd: 'verification-template-update' })
  async updateVerificationTemplate(payload: {
    templateId: string;
    updateCredentialTemplate: UpdateVerificationTemplate;
    orgId: string;
    userDetails: user;
  }): Promise<object> {
    const { templateId, updateCredentialTemplate, orgId, userDetails } = payload;
    this.logger.debug(
      `[updateVerificationTemplate] Received 'verification-template-update' for orgId=${orgId}, templateId=${templateId}, user=${userDetails?.id ?? 'unknown'}`
    );
    return this.oid4vpVerificationService.updateVerificationTemplate(
      templateId,
      updateCredentialTemplate,
      orgId,
      userDetails
    );
  }

  @MessagePattern({ cmd: 'verification-template-delete' })
  async deleteVerificationTemplate(payload: { orgId: string; templateId: string }): Promise<object> {
    const { orgId, templateId } = payload;
    this.logger.debug(
      `[deleteVerificationTemplate] Received 'verification-template-delete' for orgId=${orgId}, templateId=${templateId}`
    );
    return this.oid4vpVerificationService.deleteVerificationTemplate(orgId, templateId);
  }
}
