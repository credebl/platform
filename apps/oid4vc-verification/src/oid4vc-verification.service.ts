/* eslint-disable quotes */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { Oid4vpRepository } from './oid4vc-verification.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { getAgentUrl } from '@credebl/common/common.utils';
import { SignerOption, user } from '@prisma/client';
import { map } from 'rxjs';
import { CreateVerifier, UpdateVerifier, VerifierRecord } from '@credebl/common/interfaces/oid4vp-verification';
import { buildUrlWithQuery } from '@credebl/common/cast.helper';
import { VerificationSessionQuery } from '../interfaces/oid4vp-verifier.interfaces';
import { BaseService } from 'libs/service/base.service';
import { NATSClient } from '@credebl/common/NATSClient';

import { Oid4vpPresentationWh, RequestSigner } from '../interfaces/oid4vp-verification-sessions.interfaces';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';
import { SignerMethodOption, x5cKeyType } from '@credebl/enum/enum';
import { CreateVerificationTemplate, UpdateVerificationTemplate } from '../interfaces/verification-template.interfaces';
@Injectable()
export class Oid4vpVerificationService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly oid4vpVerificationServiceProxy: ClientProxy,
    private readonly natsClient: NATSClient,
    private readonly oid4vpRepository: Oid4vpRepository
  ) {
    super('Oid4vpVerificationService');
  }

  async oid4vpCreateVerifier(createVerifier: CreateVerifier, orgId: string, userDetails: user): Promise<object> {
    this.logger.debug(`[oid4vpCreateVerifier] called for orgId=${orgId}, user=${userDetails?.id ?? 'unknown'}`);
    try {
      let createdVerifierDetails;
      const { verifierId } = createVerifier;
      this.logger.debug(`[oid4vpCreateVerifier] checking if verifierId=${verifierId} already exists`);
      const checkIdExist = await this.oid4vpRepository.getVerifiersByPublicVerifierId(verifierId);
      if (0 < checkIdExist.length) {
        throw new ConflictException(ResponseMessages.oid4vp.error.verifierIdAlreadyExists);
      }

      this.logger.debug(`[oid4vpCreateVerifier] fetching agent endpoint for orgId=${orgId}`);
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_CREATE);
      this.logger.debug(`[oid4vpCreateVerifier] calling agent URL=${url}`);

      try {
        createdVerifierDetails = await this._createOid4vpVerifier(createVerifier, url, orgId);
        if (!createdVerifierDetails) {
          throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
        }
        createdVerifierDetails = createdVerifierDetails as VerifierRecord;
        this.logger.debug('[oid4vpCreateVerifier] verifier creation response received successfully from agent');
      } catch (error) {
        const status409 =
          409 === error?.status?.message?.statusCode || 409 === error?.response?.status || 409 === error?.statusCode;

        if (status409) {
          throw new ConflictException(`Verifier with id '${verifierId}' already exists`);
        }
        throw error;
      }

      this.logger.debug(`[oid4vpCreateVerifier] saving verifier details for orgId=${orgId}`);
      const saveVerifierDetails = await this.oid4vpRepository.createOid4vpVerifier(
        createdVerifierDetails,
        id,
        userDetails.id
      );
      if (!saveVerifierDetails) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
      }

      this.logger.debug(`[oid4vpCreateVerifier] verifier created successfully for orgId=${orgId}`);
      return saveVerifierDetails;
    } catch (error) {
      this.logger.error(
        `[oid4vpCreateVerifier] - error in oid4vpCreateVerifier issuance records: ${error?.response?.message ?? JSON.stringify(error?.response ?? error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  async oid4vpUpdateVerifier(
    updateVerifier: UpdateVerifier,
    orgId: string,
    verifierId: string,
    userDetails: user
  ): Promise<object> {
    try {
      let updatedVerifierDetails;
      const existingVerifiers = await this.oid4vpRepository.getVerifiersByVerifierId(orgId, verifierId);

      if (!existingVerifiers || 0 === existingVerifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      // updateVerifier['verifierId'] = existingVerifiers[0].publicVerifierId
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = getAgentUrl(
        agentEndPoint,
        CommonConstants.OIDC_VERIFIER_UPDATE,
        existingVerifiers[0].publicVerifierId
      );
      this.logger.debug(`[oid4vpUpdateVerifier] calling agent URL=${url}`);

      try {
        updatedVerifierDetails = await this._updateOid4vpVerifier(updateVerifier, url, orgId);
        if (!updatedVerifierDetails) {
          throw new InternalServerErrorException(ResponseMessages.oid4vp.error.updateFailed);
        }
        updatedVerifierDetails = updatedVerifierDetails.data as VerifierRecord;
      } catch (error) {
        // We'll not need this
        const status409 =
          409 === error?.status?.message?.statusCode || 409 === error?.response?.status || 409 === error?.statusCode;

        if (status409) {
          const conflictId = existingVerifiers?.[0]?.publicVerifierId ?? verifierId;
          throw new ConflictException(`Verifier with id '${conflictId}' already exists`);
        }

        throw error;
      }
      const updateVerifierDetails = await this.oid4vpRepository.updateOid4vpVerifier(
        updatedVerifierDetails,
        userDetails.id,
        verifierId
      );
      if (!updateVerifierDetails) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.updateFailed);
      }

      this.logger.debug(
        `[oid4vpUpdateVerifier] verifier updated successfully for orgId=${orgId}, verifierId=${verifierId}`
      );
      return updateVerifierDetails;
    } catch (error) {
      this.logger.error(`[oid4vpUpdateVerifier] - error in oid4vpUpdateVerifier records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerifierById(orgId: string, verifierId?: string): Promise<object> {
    this.logger.debug(`[getVerifierById] fetching verifier(s) for orgId=${orgId}, verifierId=${verifierId ?? 'all'}`);
    try {
      const verifiers = await this.oid4vpRepository.getVerifiersByVerifierId(orgId, verifierId);
      if (!verifiers || 0 === verifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      this.logger.debug(`[getVerifierById] ${verifiers.length} record(s) found`);
      return verifiers;
    } catch (error) {
      this.logger.error(`[getVerifierById] - error: ${error?.response ?? error?.message ?? JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async deleteVerifierById(orgId: string, verifierId: string): Promise<object> {
    this.logger.debug(`[deleteVerifierById] called for orgId=${orgId}, verifierId=${verifierId}`);
    try {
      const checkIdExist = await this.oid4vpRepository.getVerifiersByVerifierId(orgId, verifierId);
      if (0 == checkIdExist.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }

      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_DELETE, checkIdExist[0].verifierId);
      this.logger.debug(`[deleteVerifierById] calling agent URL=${url}`);

      await this._deleteOid4vpVerifier(url, orgId);

      const verifier = await this.oid4vpRepository.deleteVerifierByVerifierId(orgId, verifierId);

      this.logger.debug(
        `[deleteVerifierById] verifier deleted successfully for orgId=${orgId}, verifierId=${verifierId}`
      );
      return verifier;
    } catch (error) {
      this.logger.error(
        `[deleteVerifierById] - error: ${JSON.stringify(error?.response ?? error?.error ?? error ?? 'Something went wrong')}`
      );
      throw new RpcException(error?.response ?? error.error ?? error);
    }
  }

  async oid4vpCreateVerificationSession(orgId, verifierId, sessionRequest, userDetails: user): Promise<object> {
    this.logger.debug(
      `[oid4vpCreateVerificationSession] called for orgId=${orgId}, verifierId=${verifierId}, user=${userDetails?.id ?? 'unknown'}`
    );
    try {
      const activeCertificateDetails: X509CertificateRecord[] = [];
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, orgDid } = agentDetails;

      const verifier = await this.oid4vpRepository.getVerifierById(orgId, verifierId);
      if (!verifier) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }

      sessionRequest.verifierId = verifier.publicVerifierId;

      let requestSigner: RequestSigner | undefined;

      if (sessionRequest.requestSigner.method === SignerOption.DID) {
        requestSigner = {
          method: SignerMethodOption.DID,
          didUrl: orgDid
        };
      } else if (
        sessionRequest.requestSigner.method === SignerOption.X509_P256 ||
        sessionRequest.requestSigner.method === SignerOption.X509_ED25519
      ) {
        this.logger.debug('X5C based request signer method selected');

        const activeCertificate = await this.oid4vpRepository.getCurrentActiveCertificate(
          orgId,
          sessionRequest.requestSigner.method
        );
        this.logger.debug(`activeCertificate=${JSON.stringify(activeCertificate)}`);

        if (!activeCertificate) {
          throw new NotFoundException(
            `No active certificate(${sessionRequest.requestSigner.method}}) found for issuer`
          );
        }

        requestSigner = {
          method: SignerMethodOption.X5C, // "x5c"
          x5c: [activeCertificate.certificateBase64] // array with PEM/DER base64
        };

        activeCertificateDetails.push(activeCertificate);
      } else {
        throw new BadRequestException(`Unsupported requestSigner method: ${sessionRequest.requestSigner.method}`);
      }

      // assign the single object (not an array)
      sessionRequest.requestSigner = requestSigner;

      const url = getAgentUrl(agentEndPoint, CommonConstants.OID4VP_VERIFICATION_SESSION);

      const createdSession = await this._createVerificationSession(sessionRequest, url, orgId);
      if (!createdSession) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
      }

      this.logger.debug(
        `[oid4vpCreateVerificationSession] verification session created successfully for orgId=${orgId}`
      );
      return createdSession;
    } catch (error) {
      this.logger.error(
        `[oid4vpCreateVerificationSession] - error creating verification session: ${JSON.stringify(error?.response ?? error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  async createIntentBasedVerificationPresentation(
    orgId: string,
    verifierId: string,
    intent: string,
    responseMode: string,
    signerOption: SignerOption,
    userDetails: user
  ): Promise<object> {
    this.logger.debug(
      `[createIntentBasedVerificationPresentation] called for orgId=${orgId}, verifierId=${verifierId}, intent=${intent}, user=${userDetails?.id ?? 'unknown'}`
    );
    try {
      // Fetch agent details
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, orgDid } = agentDetails;

      // Fetch verifier details
      const verifier = await this.oid4vpRepository.getVerifierById(orgId, verifierId);
      if (!verifier) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }

      // Fetch intent template using utilities service
      this.logger.debug(
        `[createVerificationPresentation] fetching intent template for intent=${intent}, orgId=${orgId}`
      );
      const templateData = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'get-intent-template-by-intent-and-org',
        { intentName: intent, verifierOrgId: orgId }
      );

      if (!templateData) {
        throw new NotFoundException(`No template found for intent '${intent}' and organization '${orgId}'`);
      }

      this.logger.debug(
        `[createVerificationPresentation] template fetched successfully: ${JSON.stringify(templateData)}`
      );

      // Build session request using fetched template
      const sessionRequest = {
        verifierId: verifier.publicVerifierId,
        dcql: templateData?.template?.templateJson.dcql,
        responseMode,
        requestSigner: null
      };

      // Handle request signer based on method
      let resolvedSigner: RequestSigner | undefined;

      if (signerOption === SignerOption.DID) {
        resolvedSigner = {
          method: SignerMethodOption.DID,
          didUrl: orgDid
        };
      } else if (signerOption === SignerOption.X509_P256 || signerOption === SignerOption.X509_ED25519) {
        this.logger.debug('[createIntentBasedVerificationPresentation] X5C based request signer method selected');

        const activeCertificate = await this.oid4vpRepository.getCurrentActiveCertificate(
          orgId,
          signerOption === SignerOption.X509_P256 ? x5cKeyType.P256 : x5cKeyType.Ed25519
        );

        if (!activeCertificate) {
          throw new NotFoundException(`No active certificate(${signerOption}) found for organization`);
        }

        resolvedSigner = {
          method: SignerMethodOption.X5C,
          x5c: [activeCertificate.certificateBase64]
        };
      } else {
        throw new BadRequestException(`Unsupported requestSigner method: ${signerOption}`);
      }

      sessionRequest.requestSigner = resolvedSigner;

      const url = getAgentUrl(agentEndPoint, CommonConstants.OID4VP_VERIFICATION_SESSION);
      this.logger.debug(`[createIntentBasedVerificationPresentation] calling agent URL=${url}`);

      const createdSession = await this._createVerificationSession(sessionRequest, url, orgId);
      if (!createdSession) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
      }

      this.logger.debug(
        `[createIntentBasedVerificationPresentation] verification presentation created successfully for orgId=${orgId}`
      );
      return createdSession;
    } catch (error) {
      this.logger.error(
        `[createVerificationPresentation] - error creating verification presentation: ${JSON.stringify(error?.response ?? error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerifierSession(orgId: string, query: VerificationSessionQuery): Promise<object> {
    this.logger.debug(`[getVerifierSession] called for orgId=${orgId}, potentially with a query`);
    try {
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;

      let url = query.id
        ? getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_ID, query.id)
        : getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_QUERY);

      if (!query.id) {
        url = buildUrlWithQuery(url, query);
      }
      this.logger.debug(`[getVerifierSession] calling agent URL=${url}`);

      const verifiers = await await this._getOid4vpVerifierSession(url, orgId);
      if (!verifiers || 0 === verifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      this.logger.debug(`[getVerifierSession] ${verifiers.length} verifier session(s) found for orgId=${orgId}`);
      return verifiers;
    } catch (error) {
      this.logger.error(`[getVerifierSession] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerificationSessionResponse(orgId: string, verificationSessionId: string): Promise<object> {
    this.logger.debug(
      `[getVerificationSessionResponse] called for orgId=${orgId}, verificationSessionId=${verificationSessionId}`
    );
    try {
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = getAgentUrl(
        agentEndPoint,
        CommonConstants.OIDC_VERIFIER_SESSION_RESPONSE_GET_BY_ID,
        verificationSessionId
      );
      const verifiers = await await this._getOid4vpVerifierSession(url, orgId);
      if (!verifiers || 0 === verifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vpSession.error.responseNotFound);
      }
      this.logger.debug(`[getVerificationSessionResponse] response fetched successfully for orgId=${orgId}`);
      return verifiers;
    } catch (error) {
      this.logger.error(`[getVerificationSessionResponse] - error: ${JSON.stringify(error?.response ?? error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async oid4vpPresentationWebhook(oid4vpPresentation: Oid4vpPresentationWh, id: string): Promise<object> {
    try {
      const { contextCorrelationId } = oid4vpPresentation ?? {};
      let orgId: string;
      if ('default' !== contextCorrelationId) {
        const getOrganizationId = await this.oid4vpRepository.getOrganizationByTenantId(contextCorrelationId);
        if (!getOrganizationId) {
          throw new NotFoundException(ResponseMessages.organisation.error.notFound);
        }
        orgId = getOrganizationId?.orgId;
      } else {
        orgId = id;
      }
      const agentDetails = await this.oid4vpRepository.storeOid4vpPresentationDetails(oid4vpPresentation, orgId);
      return agentDetails;
    } catch (error) {
      this.logger.error(`[storeOid4vpPresentationWebhook] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _createOid4vpVerifier(verifierDetails: CreateVerifier, url: string, orgId: string): Promise<any> {
    this.logger.debug(`[_createOid4vpVerifier] sending NATS message for orgId=${orgId}`);
    try {
      const payload = { verifierDetails, url, orgId };
      const response = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'agent-create-oid4vp-verifier',
        payload
      );
      this.logger.debug(`[_createOid4vpVerifier] NATS response received`);
      return response;
    } catch (error) {
      this.logger.error(
        `[_createOID4VPVerifier] [NATS call]- error in create OID4VP Verifier : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _deleteOid4vpVerifier(url: string, orgId: string): Promise<any> {
    this.logger.debug(`[_deleteOid4vpVerifier] sending NATS message for orgId=${orgId}`);
    try {
      const payload = { url, orgId };
      const response = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'agent-delete-oid4vp-verifier',
        payload
      );
      this.logger.debug(`[_deleteOid4vpVerifier] NATS response received`);
      return response;
    } catch (error) {
      this.logger.error(
        `[_deleteOid4vpVerifier] [NATS call]- error in delete OID4VP Verifier : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _updateOid4vpVerifier(verifierDetails: UpdateVerifier, url: string, orgId: string): Promise<any> {
    this.logger.debug(`[_updateOid4vpVerifier] sending NATS message for orgId=${orgId}`);
    try {
      const payload = { verifierDetails, url, orgId };
      const response = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'agent-update-oid4vp-verifier',
        payload
      );
      this.logger.debug(`[_updateOid4vpVerifier] NATS response received`);
      return response;
    } catch (error) {
      this.logger.error(
        `[_updateOid4vpVerifier] [NATS call]- error in update OID4VP Verifier : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _createVerificationSession(sessionRequest: any, url: string, orgId: string): Promise<any> {
    this.logger.debug(`[_createVerificationSession] sending NATS message for orgId=${orgId}`);
    try {
      const payload = { sessionRequest, url, orgId };
      const response = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'agent-create-oid4vp-verification-session',
        payload
      );
      this.logger.debug(`[_createVerificationSession] NATS response received`);
      return response;
    } catch (error) {
      this.logger.error(
        `[_createVerificationSession] [NATS call]- error in create verification session : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _getOid4vpVerifierSession(url: string, orgId: string): Promise<any> {
    this.logger.debug(`[_getOid4vpVerifierSession] sending NATS message for orgId=${orgId}`);
    try {
      const payload = { url, orgId };
      const response = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'agent-get-oid4vp-verifier-session',
        payload
      );
      this.logger.debug(`[_getOid4vpVerifierSession] NATS response received`);
      return response;
    } catch (error) {
      this.logger.error(
        `[_getOid4vpVerifierSession] [NATS call]- error in get OID4VP Verifier Session : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _getVerificationSessionResponse(url: string, orgId: string): Promise<any> {
    this.logger.debug(`[_getVerificationSessionResponse] sending NATS message for orgId=${orgId}`);
    try {
      const payload = { url, orgId };
      const response = await this.natsClient.sendNatsMessage(
        this.oid4vpVerificationServiceProxy,
        'agent-get-oid4vp-verifier-session',
        payload
      );
      this.logger.debug(`[_getVerificationSessionResponse] NATS response received`);
      return response;
    } catch (error) {
      this.logger.error(
        `[_getVerificationSessionResponse] [NATS call]- error in get OID4VP Verifier Session : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async createVerificationTemplate(
    createTemplateDto: CreateVerificationTemplate,
    orgId: string,
    userDetails: user
  ): Promise<object> {
    this.logger.debug(`[createVerificationTemplate] called for orgId=${orgId}, user=${userDetails?.id}`);
    try {
      const created = await this.oid4vpRepository.createVerificationTemplate(createTemplateDto, orgId, userDetails.id);
      if (!created) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
      }
      this.logger.debug(`[createVerificationTemplate] template created successfully for orgId=${orgId}`);
      return created;
    } catch (error) {
      this.logger.error(`[createVerificationTemplate] - error: ${error}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerificationTemplates(orgId: string, templateId?: string): Promise<object> {
    this.logger.debug(
      `[getVerificationTemplates] fetching templates for orgId=${orgId}, templateId=${templateId ?? 'all'}`
    );
    try {
      const templates = await this.oid4vpRepository.getVerificationTemplates(orgId, templateId);
      if (!templates || 0 === templates.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      this.logger.debug(`[getVerificationTemplates] ${templates.length} record(s) found`);
      return templates;
    } catch (error) {
      this.logger.error(
        `[getVerificationTemplates] - error: ${error?.response ?? error?.message ?? JSON.stringify(error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  async updateVerificationTemplate(
    templateId: string,
    updateCredentialTemplate: UpdateVerificationTemplate,
    orgId: string,
    userDetails: user
  ): Promise<object> {
    this.logger.debug(
      `[updateVerificationTemplate] called for orgId=${orgId}, templateId=${templateId}, user=${userDetails?.id}`
    );
    try {
      const existing = await this.oid4vpRepository.getVerificationTemplateById(orgId, templateId);
      if (!existing) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }

      const updated = await this.oid4vpRepository.updateVerificationTemplate(
        templateId,
        updateCredentialTemplate,
        orgId,
        userDetails.id
      );
      if (!updated) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.updateFailed);
      }

      this.logger.debug(
        `[updateVerificationTemplate] template updated successfully for orgId=${orgId}, templateId=${templateId}`
      );
      return updated;
    } catch (error) {
      this.logger.error(`[updateVerificationTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async deleteVerificationTemplate(orgId: string, templateId: string): Promise<object> {
    this.logger.debug(`[deleteVerificationTemplate] called for orgId=${orgId}, templateId=${templateId}`);
    try {
      const existing = await this.oid4vpRepository.getVerificationTemplateById(orgId, templateId);
      if (!existing) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }

      const deleted = await this.oid4vpRepository.deleteVerificationTemplate(orgId, templateId);

      this.logger.debug(
        `[deleteVerificationTemplate] template deleted successfully for orgId=${orgId}, templateId=${templateId}`
      );
      return deleted;
    } catch (error) {
      this.logger.error(
        `[deleteVerificationTemplate] - error: ${JSON.stringify(error?.response ?? error?.error ?? error ?? 'Something went wrong')}`
      );
      throw new RpcException(error?.response ?? error.error ?? error);
    }
  }
}
