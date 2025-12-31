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
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Scope
} from '@nestjs/common';
import { Oid4vcIssuanceRepository } from './oid4vc-issuance.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import { getAgentUrl } from '@credebl/common/common.utils';
import { credential_templates, oidc_issuer, Prisma, SignerOption, user } from '@prisma/client';
import {
  IAgentOIDCIssuerCreate,
  IssuerCreation,
  IssuerInitialConfig,
  IssuerMetadata,
  IssuerResponse,
  IssuerUpdation
} from '../interfaces/oid4vc-issuance.interfaces';
import { CreateCredentialTemplate, UpdateCredentialTemplate } from '../interfaces/oid4vc-template.interfaces';
import {
  accessTokenSignerKeyType,
  batchCredentialIssuanceDefault,
  credentialConfigurationsSupported,
  dpopSigningAlgValuesSupported
} from '../constant/issuance';
import {
  buildCredentialConfigurationsSupported,
  buildIssuerPayload,
  encodeIssuerPublicId,
  extractTemplateIds,
  normalizeJson
} from '../libs/helpers/issuer.metadata';
import {
  CreateOidcCredentialOffer,
  GetAllCredentialOffer,
  ISignerOption,
  SignerMethodOption,
  UpdateCredentialRequest
} from '../interfaces/oid4vc-issuer-sessions.interfaces';
import {
  buildCredentialOfferPayload,
  buildCredentialOfferUrl,
  CredentialOfferPayload
} from '../libs/helpers/credential-sessions.builder';
import { x5cKeyType } from '@credebl/enum/enum';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';
import { Oid4vcCredentialOfferWebhookPayload } from '../interfaces/oid4vc-wh-interfaces';
import { ErrorHandler } from '@credebl/common';

type CredentialDisplayItem = {
  logo?: { uri: string; alt_text?: string };
  name: string;
  locale?: string;
  description?: string;
};

type Appearance = {
  display: CredentialDisplayItem[];
};
@Injectable()
export class Oid4vcIssuanceService {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceServiceProxy: ClientProxy,
    private readonly oid4vcIssuanceRepository: Oid4vcIssuanceRepository
  ) {}

  async oidcIssuerCreate(issuerCreation: IssuerCreation, orgId: string, userDetails: user): Promise<oidc_issuer> {
    try {
      const { issuerId, batchCredentialIssuanceSize } = issuerCreation;
      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id: orgAgentId, orgAgentTypeId } = agentDetails;
      const orgAgentType = await this.oid4vcIssuanceRepository.getOrgAgentType(orgAgentTypeId);
      if (!orgAgentType) {
        throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
      }
      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_CREATE);
      const issuerInitialConfig: IssuerInitialConfig = {
        issuerId,
        display: issuerCreation?.display || {},
        authorizationServerConfigs: issuerCreation?.authorizationServerConfigs || undefined,
        accessTokenSignerKeyType,
        dpopSigningAlgValuesSupported,
        credentialConfigurationsSupported,
        ...(batchCredentialIssuanceSize && 0 < batchCredentialIssuanceSize
          ? {
              batchCredentialIssuance: {
                batchSize: batchCredentialIssuanceSize
              }
            }
          : {})
      };
      let createdIssuer;
      try {
        createdIssuer = await this._createOIDCIssuer(issuerInitialConfig, url, orgId);
      } catch (error) {
        this.logger.error(`[oidcIssuerCreate] - error in oidcIssuerCreate issuance records: ${JSON.stringify(error)}`);
        const status409 =
          409 === error?.status?.message?.statusCode || 409 === error?.response?.status || 409 === error?.statusCode;

        if (status409) {
          throw new ConflictException(`Issuer with id '${issuerCreation.issuerId}' already exists`);
        }
        throw error;
      }
      const issuerConfigJson = createdIssuer?.response ?? createdIssuer ?? {};
      const issuerIdFromAgent = issuerConfigJson?.issuerId;

      if (!issuerIdFromAgent) {
        throw new InternalServerErrorException('Issuer ID missing from agent response');
      }
      const issuerMetadata: IssuerMetadata = {
        authorizationServerUrl: issuerCreation.authorizationServerUrl,
        publicIssuerId: issuerIdFromAgent,
        createdById: userDetails.id,
        orgAgentId,
        batchCredentialIssuanceSize: issuerCreation?.batchCredentialIssuanceSize
      };
      const addOidcIssuerDetails = await this.oid4vcIssuanceRepository.addOidcIssuerDetails(
        issuerMetadata,
        issuerCreation?.display
      );

      if (!addOidcIssuerDetails) {
        throw new InternalServerErrorException('Error in adding OID4VC Issuer details in DB');
      }
      return addOidcIssuerDetails;
    } catch (error) {
      this.logger.error(`[oidcIssuerCreate] - error in oidcIssuerCreate issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async oidcIssuerUpdate(issuerUpdationConfig: IssuerUpdation, orgId: string, userDetails: user): Promise<oidc_issuer> {
    try {
      const getIssuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(
        issuerUpdationConfig.issuerId
      );
      if (!getIssuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.notFound);
      }
      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, orgAgentTypeId } = agentDetails;
      const orgAgentType = await this.oid4vcIssuanceRepository.getOrgAgentType(orgAgentTypeId);
      if (!orgAgentType) {
        throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
      }

      const addOidcIssuerDetails = await this.oid4vcIssuanceRepository.updateOidcIssuerDetails(
        userDetails.id,
        issuerUpdationConfig
      );

      if (!addOidcIssuerDetails) {
        throw new InternalServerErrorException('Error in updating OID4VC Issuer details in DB');
      }

      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, getIssuerDetails.publicIssuerId);
      const issuerConfig = await this.buildOidcIssuerConfig(issuerUpdationConfig.issuerId);
      const updatedIssuer = await this._createOIDCTemplate(issuerConfig, url, orgId);
      if (updatedIssuer?.response?.statusCode && 200 !== updatedIssuer?.response?.statusCode) {
        throw new InternalServerErrorException(
          `Error from agent while updating issuer: ${updatedIssuer?.response?.message ?? 'Unknown error'}`
        );
      }

      return addOidcIssuerDetails;
    } catch (error) {
      this.logger.error(`[oidcIssuerUpdate] - error in oidcIssuerUpdate issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async oidcIssuerGetById(id: string, orgId: string): Promise<IssuerResponse> {
    try {
      const getIssuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(id);
      if (!getIssuerDetails && !getIssuerDetails.publicIssuerId) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.notFound);
      }
      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const encodedId = encodeIssuerPublicId(getIssuerDetails?.publicIssuerId);
      const url = getAgentUrl(agentDetails?.agentEndPoint, CommonConstants.OIDC_ISSUER_BY_ID, encodedId);
      const issuerDetailsRaw = await this._oidcGetIssuerById(url, orgId);
      if (!issuerDetailsRaw) {
        throw new InternalServerErrorException(`Error from agent while getting issuer`);
      }
      const issuerDetails = {
        response: normalizeJson(issuerDetailsRaw.response)
      };

      return issuerDetails.response;
    } catch (error) {
      const errorStack = error?.status?.message?.error;
      if (errorStack) {
        throw new RpcException({
          message: errorStack?.reason ? errorStack?.reason : errorStack?.message,
          statusCode: error?.status?.code
        });
      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async oidcIssuers(orgId: string): Promise<any> {
    //Promise<IssuerResponse[]> {
    try {
      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails?.agentEndPoint) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const getIssuers = await this.oid4vcIssuanceRepository.getAllOidcIssuersByOrg(orgId);

      // const url = getAgentUrl(agentDetails.agentEndPoint, CommonConstants.OIDC_GET_ALL_ISSUERS);
      // const issuersDetails = await this._oidcGetIssuers(url, orgId);
      // if (!issuersDetails || null == issuersDetails.response) {
      //   throw new InternalServerErrorException('Error from agent while oidcIssuers');
      // }
      // //TODO: Fix the response type from agent
      // const raw = issuersDetails.response as unknown;
      // const response: IssuerResponse[] =
      //   'string' === typeof raw ? (JSON.parse(raw) as IssuerResponse[]) : (raw as IssuerResponse[]);

      // if (!Array.isArray(response)) {
      //   throw new InternalServerErrorException('Invalid issuer payload from agent');
      // }
      // return response;
      return getIssuers;
    } catch (error: any) {
      const msg = error?.message ?? 'unknown error';
      this.logger.error(`[oidcIssuers] - error in oidcIssuers: ${msg}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async deleteOidcIssuer(orgId: string, userDetails: user, id: string) {
    try {
      const issuerRecordId = await this.oidcIssuerGetById(id, orgId);
      if (!issuerRecordId.id) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.notFound);
      }
      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;
      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_DELETE, issuerRecordId.id);
      const createTemplateOnAgent = await this._deleteOidcIssuer(url, orgId);
      if (!createTemplateOnAgent) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const deleteOidcIssuer = await this.oid4vcIssuanceRepository.deleteOidcIssuer(id);
      if (!deleteOidcIssuer) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.deleteFailed);
      }
      return deleteOidcIssuer;
    } catch (error) {
      if ('PrismaClientKnownRequestError' === error.name) {
        throw new BadRequestException(error.meta?.cause ?? ResponseMessages.oidcIssuer.error.deleteFailed);
      }
      throw new Error(error.response ? error.response : error);
    }
  }

  async createTemplate(
    credentialTemplate: CreateCredentialTemplate,
    orgId: string,
    issuerId: string
  ): Promise<credential_templates> {
    try {
      //TODO: add revert mechanism if agent call fails
      const { name, description, format, canBeRevoked, appearance, signerOption } = credentialTemplate;

      const checkNameExist = await this.oid4vcIssuanceRepository.getTemplateByNameForIssuer(name, issuerId);
      if (0 < checkNameExist.length) {
        throw new ConflictException(ResponseMessages.oidcTemplate.error.templateNameAlreadyExist);
      }
      const metadata = {
        name,
        description,
        format: format.toString(),
        canBeRevoked,
        attributes: instanceToPlain(credentialTemplate.template),
        appearance: appearance ?? {},
        issuerId,
        signerOption
      };
      // Persist in DB
      const createdTemplate = await this.oid4vcIssuanceRepository.createTemplate(issuerId, metadata);
      if (!createdTemplate) {
        throw new InternalServerErrorException(ResponseMessages.oidcTemplate.error.createFailed);
      }

      let createTemplateOnAgent;
      try {
        const issuerTemplateConfig = await this.buildOidcIssuerConfig(issuerId);
        const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
        if (!agentDetails) {
          throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
        }
        const { agentEndPoint } = agentDetails;
        const issuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(issuerId);
        if (!issuerDetails) {
          throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
        }
        const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, issuerDetails.publicIssuerId);
        createTemplateOnAgent = await this._createOIDCTemplate(issuerTemplateConfig, url, orgId);
      } catch (agentError) {
        try {
          await this.oid4vcIssuanceRepository.deleteTemplate(createdTemplate.id);
          this.logger.log(`${ResponseMessages.oidcTemplate.success.deleteTemplate}${createdTemplate.id}`);
          throw new RpcException(agentError?.response ?? agentError);
        } catch (cleanupError) {
          this.logger.error(
            `${ResponseMessages.oidcTemplate.error.failedDeleteTemplate}${createdTemplate.id} deleteError=${JSON.stringify(
              cleanupError
            )} originalAgentError=${JSON.stringify(agentError)}`
          );
          throw new RpcException('Template creation failed and cleanup also failed');
        }
      }
      if (!createTemplateOnAgent) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      return createdTemplate;
    } catch (error) {
      this.logger.error(`[createTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async updateTemplate(
    templateId: string,
    updateCredentialTemplate: UpdateCredentialTemplate,
    orgId: string,
    issuerId: string
  ): Promise<credential_templates> {
    try {
      const template = await this.oid4vcIssuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }
      if (updateCredentialTemplate.name) {
        const checkNameExist = await this.oid4vcIssuanceRepository.getTemplateByNameForIssuer(
          updateCredentialTemplate.name,
          issuerId
        );
        if (0 < checkNameExist.length && !checkNameExist.some((item) => item.id === templateId)) {
          throw new ConflictException(ResponseMessages.oidcTemplate.error.templateNameAlreadyExist);
        }
      }
      const normalized = {
        ...updateCredentialTemplate,
        ...(issuerId ? { issuerId } : {})
      };
      const { name, description, format, canBeRevoked, appearance, signerOption } = normalized;
      const attributes = instanceToPlain(normalized.template);

      const payload = {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(format !== undefined ? { format } : {}),
        ...(canBeRevoked !== undefined ? { canBeRevoked } : {}),
        ...(attributes !== undefined ? { attributes } : {}),
        ...(appearance !== undefined ? { appearance } : {}),
        ...(issuerId ? { issuerId } : {}),
        ...(signerOption !== undefined ? { signerOption } : {})
      };

      const updatedTemplate = await this.oid4vcIssuanceRepository.updateTemplate(templateId, payload);

      try {
        const templates = await this.oid4vcIssuanceRepository.getTemplatesByIssuerId(issuerId);
        if (!templates || 0 === templates.length) {
          throw new NotFoundException(ResponseMessages.issuance.error.notFound);
        }
        const issuerTemplateConfig = await this.buildOidcIssuerConfig(issuerId);
        const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
        if (!agentDetails) {
          throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
        }
        const { agentEndPoint } = agentDetails;
        const issuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(issuerId);
        if (!issuerDetails) {
          throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
        }
        const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, issuerDetails.publicIssuerId);

        const createTemplateOnAgent = await this._createOIDCTemplate(issuerTemplateConfig, url, orgId);
        if (!createTemplateOnAgent) {
          throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
        }
      } catch (agentError) {
        this.logger.error(`[updateTemplate] - error updating template on agent: ${JSON.stringify(agentError)}`);
        try {
          const rollbackPayload = {
            name: template.name,
            description: template.description,
            format: template.format,
            canBeRevoked: template.canBeRevoked,
            attributes: template.attributes,
            appearance: template.appearance,
            issuerId: template.issuerId
          };
          await this.oid4vcIssuanceRepository.updateTemplate(templateId, rollbackPayload);
          this.logger.log(`Rolled back template ${templateId} to previous state after agent error`);
          throw new RpcException(agentError?.response ?? agentError);
        } catch (revertError) {
          this.logger.error(
            `[updateTemplate] - rollback failed for template ${templateId}: ${JSON.stringify(revertError)} originalAgentError=${JSON.stringify(
              agentError
            )}`
          );
          const wrappedError = {
            message: 'Template update failed and rollback also failed',
            agentError: agentError?.response ?? agentError,
            rollbackError: revertError?.response ?? revertError
          };
          throw new RpcException(wrappedError);
        }
      }

      return updatedTemplate;
    } catch (error) {
      this.logger.error(`[updateTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteTemplate(templateId: string, orgId: string, userDetails: user, issuerId: string): Promise<any> {
    try {
      const template = await this.oid4vcIssuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }
      const deleteTemplate = await this.oid4vcIssuanceRepository.deleteTemplate(templateId);
      if (!deleteTemplate) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.deleteTemplate);
      }

      const issuerTemplateConfig = await this.buildOidcIssuerConfig(issuerId);
      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;
      const issuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, issuerDetails.publicIssuerId);

      const createTemplateOnAgent = await this._createOIDCTemplate(issuerTemplateConfig, url, orgId);
      if (!createTemplateOnAgent) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      return deleteTemplate;
    } catch (error) {
      this.logger.error(`[deleteTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async findByIdTemplate(templateId: string, orgId: string): Promise<credential_templates | null> {
    try {
      if (!orgId || !templateId) {
        throw new BadRequestException(ResponseMessages.oidcTemplate.error.invalidId);
      }
      const template = await this.oid4vcIssuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }
      return template;
    } catch (error) {
      this.logger.error(`[findByIdTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async createOidcCredentialOffer(
    createOidcCredentialOffer: CreateOidcCredentialOffer,
    orgId: string,
    userDetails: user,
    issuerId: string
  ): Promise<any> {
    try {
      const filterTemplateIds = extractTemplateIds(createOidcCredentialOffer);
      if (!filterTemplateIds) {
        throw new BadRequestException('Please provide a valid id');
      }
      const getAllOfferTemplates = await this.oid4vcIssuanceRepository.getTemplateByIds(filterTemplateIds, issuerId);
      if (!getAllOfferTemplates) {
        throw new NotFoundException('No templates found for the issuer');
      }

      const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      //TDOD: signerOption should be under credentials change this with x509 support

      //TDOD: signerOption should be under credentials change this with x509 support
      const signerOptions: ISignerOption[] = [];
      const activeCertificateDetails: X509CertificateRecord[] = [];
      for (const template of getAllOfferTemplates) {
        if (template.signerOption === SignerOption.DID) {
          signerOptions.push({
            method: SignerMethodOption.DID,
            did: agentDetails.orgDid
          });
        }

        if (template.signerOption == SignerOption.X509_P256) {
          const activeCertificate = await this.oid4vcIssuanceRepository.getCurrentActiveCertificate(
            orgId,
            x5cKeyType.P256
          );

          if (!activeCertificate) {
            throw new NotFoundException('No active certificate(p256) found for issuer');
          }
          signerOptions.push({
            method: SignerMethodOption.X5C,
            x5c: [activeCertificate.certificateBase64]
          });
          activeCertificateDetails.push(activeCertificate);
        }

        if (template.signerOption == SignerOption.X509_ED25519) {
          const activeCertificate = await this.oid4vcIssuanceRepository.getCurrentActiveCertificate(
            orgId,
            x5cKeyType.Ed25519
          );

          if (!activeCertificate) {
            throw new NotFoundException('No active certificate(ed25519) found for issuer');
          }
          signerOptions.push({
            method: SignerMethodOption.X5C,
            x5c: [activeCertificate.certificateBase64]
          });
          activeCertificateDetails.push(activeCertificate);
        }
      }
      //TODO: Implement x509 support and discuss with team
      //TODO: add logic to pass the issuer info
      const issuerDetailsFromDb = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(issuerId);
      const { publicIssuerId, authorizationServerUrl } = issuerDetailsFromDb || {};
      const buildOidcCredentialOffer: CredentialOfferPayload = buildCredentialOfferPayload(
        createOidcCredentialOffer,
        //
        getAllOfferTemplates,
        {
          publicId: publicIssuerId,
          authorizationServerUrl: `${authorizationServerUrl}/oid4vci/${publicIssuerId}`
        },
        signerOptions,
        activeCertificateDetails
      );

      if (!buildOidcCredentialOffer) {
        throw new BadRequestException('Error while creating oid4vc credential offer');
      }
      const issuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      buildOidcCredentialOffer.publicIssuerId = issuerDetails.publicIssuerId;
      const url = getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_ISSUER_SESSIONS_CREDENTIAL_OFFER,
        issuerDetails.publicIssuerId
      );
      this.logger.debug(`Creating OIDC Credential Offer for :`, buildOidcCredentialOffer);
      const createCredentialOfferOnAgent = await this._oidcCreateCredentialOffer(buildOidcCredentialOffer, url, orgId);
      if (!createCredentialOfferOnAgent) {
        throw new NotFoundException(ResponseMessages.oidcIssuerSession.error.errorCreateOffer);
      }

      return createCredentialOfferOnAgent.response;
    } catch (error) {
      const errorResponse = ErrorHandler.categorize(error, 'Failed to create credential offer');
      this.logger.error(
        `[createOidcCredentialOffer] - ${errorResponse.statusCode}: ${errorResponse.message}`,
        ErrorHandler.format(error)
      );
      throw new RpcException(errorResponse);
    }
  }

  async createOidcCredentialOfferD2A(oidcCredentialD2APayload, orgId: string): Promise<object | string> {
    try {
      for (const credential of oidcCredentialD2APayload.credentials) {
        const { signerOptions } = credential;

        if (!signerOptions?.method) {
          throw new BadRequestException(`signerOptions.method is required`);
        }
        if (signerOptions.method === SignerMethodOption.X5C) {
          if (!signerOptions.x5c || 0 === signerOptions.x5c.length) {
            // const x5cFromDb = await this.oid4vcIssuanceRepository.getIssuerX5c(
            const x5cFromDb = 'Test';
            // If you want to use the actual DB call, uncomment and use:
            // const x5cFromDb = await this.oid4vcIssuanceRepository.getIssuerX5c(
            //   oidcCredentialD2APayload.publicIssuerId,
            //   orgId
            // );
            if (!x5cFromDb || 0 === x5cFromDb.length) {
              throw new BadRequestException(`No x5c found for issuer`);
            }
            signerOptions.x5c = x5cFromDb;
          }
        }

        if (signerOptions.method === SignerMethodOption.DID) {
          if (!signerOptions.did) {
            const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);
            if (!agentDetails) {
              throw new BadRequestException(`No DID found for issuer`);
            }
            signerOptions.did = agentDetails.orgDid;
          }
        }
      }

      const url = getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_ISSUER_SESSIONS_CREDENTIAL_OFFER
      );
      const createCredentialOfferOnAgent = await this._oidcCreateCredentialOffer(oidcCredentialD2APayload, url, orgId);
      if (!createCredentialOfferOnAgent) {
        throw new NotFoundException(ResponseMessages.oidcIssuerSession.error.errorCreateOffer);
      }

      return createCredentialOfferOnAgent.response;
    } catch (error) {
      this.logger.error(`[createOidcCredentialOffer] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async updateOidcCredentialOffer(
    updateOidcCredentialOffer: UpdateCredentialRequest,
    orgId: string,
    issuerId: string
  ): Promise<any> {
    try {
      if (!updateOidcCredentialOffer.issuerMetadata) {
        throw new BadRequestException('Please provide a valid issuerMetadata');
      }
      const url = getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_ISSUER_SESSIONS_UPDATE_OFFER,
        updateOidcCredentialOffer.credentialOfferId
      );
      const updateCredentialOfferOnAgent = await this._oidcUpdateCredentialOffer(
        updateOidcCredentialOffer.issuerMetadata,
        url,
        orgId
      );
      if (!updateCredentialOfferOnAgent) {
        throw new NotFoundException(ResponseMessages.oidcIssuerSession.error.errorUpdateOffer);
      }

      return updateCredentialOfferOnAgent.response;
    } catch (error) {
      throw new RpcException(error.response ?? error);
    }
  }

  async getCredentialOfferDetailsById(offerId: string, orgId: string): Promise<any> {
    try {
      const url = getAgentUrl(await this.getAgentEndpoint(orgId), CommonConstants.OIDC_ISSUER_SESSIONS_BY_ID, offerId);
      const offer = await this._oidcGetCredentialOfferById(url, orgId);
      if ('string' === typeof offer.response) {
        offer.response = JSON.parse(offer.response);
      }
      return offer.response;
    } catch (error) {
      this.logger.error(`[getCredentialOfferDetailsById] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async getCredentialOffers(orgId: string, getAllCredentialOffer: GetAllCredentialOffer): Promise<any> {
    try {
      const url = getAgentUrl(await this.getAgentEndpoint(orgId), CommonConstants.OIDC_ISSUER_SESSIONS);
      const credentialOfferUrl = buildCredentialOfferUrl(url, getAllCredentialOffer);
      const offers = await this._oidcGetCredentialOffers(credentialOfferUrl, orgId);
      if ('string' === typeof offers.response) {
        offers.response = JSON.parse(offers.response);
      }
      return offers.response;
    } catch (error) {
      this.logger.error(`[getCredentialOffers] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }
  async deleteCredentialOffers(orgId: string, credentialId: string): Promise<any> {
    try {
      if (!credentialId) {
        throw new BadRequestException('Please provide a valid credentialId');
      }
      const url = getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_DELETE_CREDENTIAL_OFFER,
        credentialId
      );
      const deletedCredentialOffer = await this._oidcDeleteCredentialOffer(url, orgId);
      if (!deletedCredentialOffer) {
        throw new NotFoundException(ResponseMessages.oidcIssuerSession.error.deleteFailed);
      }
      if ('string' === typeof deletedCredentialOffer.response) {
        deletedCredentialOffer.response = JSON.parse(deletedCredentialOffer.response);
      }
      return deletedCredentialOffer.response;
    } catch (error) {
      this.logger.error(`[getCredentialOffers] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async buildOidcIssuerConfig(issuerId: string) {
    try {
      const issuerDetails = await this.oid4vcIssuanceRepository.getOidcIssuerDetailsById(issuerId);
      const templates = await this.oid4vcIssuanceRepository.getTemplatesByIssuerId(issuerId);

      const credentialConfigurationsSupported = buildCredentialConfigurationsSupported(templates);

      return buildIssuerPayload({ credentialConfigurationsSupported }, issuerDetails);
    } catch (error) {
      this.logger.error(`[buildOidcIssuerPayload] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async findAllTemplate(orgId: string, issuerId: string): Promise<credential_templates[]> {
    try {
      if (!orgId || !issuerId) {
        throw new BadRequestException(ResponseMessages.oidcTemplate.error.invalidId);
      }
      return this.oid4vcIssuanceRepository.getTemplatesByIssuerId(issuerId);
    } catch (error) {
      this.logger.error(`[findAllTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _createOIDCIssuer(issuerCreation, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oid4vc-issuer' };
      const payload: IAgentOIDCIssuerCreate = { issuerCreation, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_createOIDCIssuer] [NATS call]- error in create OID4VC Issuer : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _createOIDCTemplate(templatePayload, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oid4vc-template' };
      const payload = { templatePayload, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_createOIDCTemplate] [NATS call]- error in create OID4VC Template : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _deleteOidcIssuer(url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'delete-oid4vc-issuer' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_createOIDCTemplate] [NATS call]- error in create OID4VC Template : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcGetIssuerById(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'oid4vc-get-issuer-by-id' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcGetIssuerById] [NATS call]- error in oid4vc get issuer by id : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcGetIssuers(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'oid4vc-get-issuers-agent-service' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_oidcGetIssuers] [NATS call]- error in oid4vc get issuers : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _oidcCreateCredentialOffer(credentialPayload: CredentialOfferPayload, url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oid4vc-create-credential-offer' };
      const payload = { credentialPayload, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcCreateCredentialOffer] [NATS call]- error in oid4vc create credential offer : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcUpdateCredentialOffer(issuanceMetadata, url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oid4vc-update-credential-offer' };
      const payload = { issuanceMetadata, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcUpdateCredentialOffer] [NATS call]- error in oid4vc update credential offer : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcGetCredentialOfferById(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oid4vc-get-credential-offer-by-id' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcGetCredentialOfferById] [NATS call]- error in oid4vc get credential offer by id : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcGetCredentialOffers(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oid4vc-get-credential-offers' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcGetCredentialOffers] [NATS call]- error in oid4vc get credential offers : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcDeleteCredentialOffer(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oid4vc-delete-credential-offer' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcDeleteCredentialOffer] [NATS call]- error in oid4vc delete credential offer : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async natsCall(
    pattern: object,
    payload: object
  ): Promise<{
    response: string;
  }> {
    try {
      return this.issuanceServiceProxy
        .send<string>(pattern, payload)
        .pipe(
          map((response) => ({
            response
          }))
        )
        .toPromise()
        .catch((error) => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            },
            error.error
          );
        });
    } catch (error) {
      this.logger.error(`[natsCall] - error in nats call : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAgentEndpoint(orgId: string): Promise<string> {
    const agentDetails = await this.oid4vcIssuanceRepository.getAgentEndPoint(orgId);

    if (!agentDetails) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    if (!agentDetails.agentEndPoint || '' === agentDetails.agentEndPoint.trim()) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    return agentDetails.agentEndPoint;
  }

  async storeOidcCredentialWebhook(
    CredentialOfferWebhookPayload: Oid4vcCredentialOfferWebhookPayload
  ): Promise<object> {
    try {
      // pick fields
      let organisationId: string;
      const { oidcIssueCredentialDto, id } = CredentialOfferWebhookPayload;

      if ('default' !== oidcIssueCredentialDto?.contextCorrelationId) {
        const getOrganizationId = await this.oid4vcIssuanceRepository.getOrganizationByTenantId(
          oidcIssueCredentialDto?.contextCorrelationId
        );
        organisationId = getOrganizationId?.orgId;
      } else {
        organisationId = id;
      }

      const {
        contextCorrelationId,
        credentialOfferPayload,
        issuedCredentials,
        id: issuanceSessionId
      } = oidcIssueCredentialDto ?? {};
      const cfgIds: string[] = Array.isArray(credentialOfferPayload?.credential_configuration_ids)
        ? credentialOfferPayload.credential_configuration_ids
        : [];
      const issuedCredentialsArr: string[] | undefined =
        Array.isArray(issuedCredentials) && 0 < issuedCredentials.length
          ? issuedCredentials.map((c: any) => ('string' === typeof c ? c : JSON.stringify(c)))
          : issuedCredentials && Array.isArray(issuedCredentials) && 0 === issuedCredentials.length
            ? []
            : undefined;

      const sanitized = {
        ...CredentialOfferWebhookPayload,
        credentialOfferPayload: {
          credential_configuration_ids: cfgIds
        }
      };

      const agentDetails = await this.oid4vcIssuanceRepository.storeOidcCredentialDetails(
        CredentialOfferWebhookPayload,
        organisationId
      );
      return agentDetails;
    } catch (error) {
      this.logger.error(`[storeOidcCredentialWebhook] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
