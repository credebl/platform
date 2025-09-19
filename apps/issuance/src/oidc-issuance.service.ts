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
import { IssuanceRepository } from './issuance.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import { getAgentUrl } from '@credebl/common/common.utils';
import { credential_templates, oidc_issuer, user } from '@prisma/client';
import {
  IAgentOIDCIssuerCreate,
  IssuerCreation,
  IssuerInitialConfig,
  IssuerMetadata,
  IssuerResponse,
  IssuerUpdation
} from '../interfaces/oidc-issuance.interfaces';
import { CreateCredentialTemplate, UpdateCredentialTemplate } from '../interfaces/oidc-template.interface';
import {
  accessTokenSignerKeyType,
  batchCredentialIssuanceDefault,
  credentialConfigurationsSupported,
  dpopSigningAlgValuesSupported
} from '../constant/issuance';
import {
  buildCredentialConfigurationsSupported,
  buildIssuerPayload,
  extractTemplateIds
} from '../libs/helpers/issuer.metadata';
import {
  CreateOidcCredentialOffer,
  GetAllCredentialOffer,
  SignerMethodOption,
  SignerOption,
  UpdateCredentialRequest
} from '../interfaces/oidc-issuer-sessions.interfaces';
import { BadRequestErrorDto } from 'apps/api-gateway/src/dtos/bad-request-error.dto';
import {
  buildCredentialOfferPayload,
  buildCredentialOfferUrl,
  buildUpdateCredentialOfferPayload,
  CredentialOfferPayload
} from '../libs/helpers/credential-sessions.builder';

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
export class OIDCIssuanceService {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceServiceProxy: ClientProxy,
    private readonly issuanceRepository: IssuanceRepository
  ) {}

  async oidcIssuerCreate(issuerCreation: IssuerCreation, orgId: string, userDetails: user): Promise<oidc_issuer> {
    try {
      const { issuerId, batchCredentialIssuanceSize } = issuerCreation;
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id: orgAgentId, orgAgentTypeId } = agentDetails;
      const orgAgentType = await this.issuanceRepository.getOrgAgentType(orgAgentTypeId);
      if (!orgAgentType) {
        throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
      }
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_CREATE);
      const issuerInitialConfig: IssuerInitialConfig = {
        issuerId,
        display: issuerCreation?.display || {},
        authorizationServerConfigs: issuerCreation?.authorizationServerConfigs || undefined,
        accessTokenSignerKeyType,
        dpopSigningAlgValuesSupported,
        batchCredentialIssuance: {
          batchSize: batchCredentialIssuanceSize ?? batchCredentialIssuanceDefault
        },
        credentialConfigurationsSupported
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
        publicIssuerId: issuerIdFromAgent,
        createdById: userDetails.id,
        orgAgentId,
        batchCredentialIssuanceSize: issuerCreation?.batchCredentialIssuanceSize
      };
      const addOidcIssuerDetails = await this.issuanceRepository.addOidcIssuerDetails(
        issuerMetadata,
        issuerCreation?.display
      );

      if (!addOidcIssuerDetails) {
        throw new InternalServerErrorException('Error in adding OIDC Issuer details in DB');
      }
      return addOidcIssuerDetails;
    } catch (error) {
      this.logger.error(`[oidcIssuerCreate] - error in oidcIssuerCreate issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async oidcIssuerUpdate(issuerUpdationConfig: IssuerUpdation, orgId: string, userDetails: user): Promise<oidc_issuer> {
    try {
      const getIssuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerUpdationConfig.issuerId);
      if (!getIssuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.notFound);
      }
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id: orgAgentId, orgAgentTypeId } = agentDetails;
      const orgAgentType = await this.issuanceRepository.getOrgAgentType(orgAgentTypeId);
      if (!orgAgentType) {
        throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
      }

      const addOidcIssuerDetails = await this.issuanceRepository.updateOidcIssuerDetails(
        userDetails.id,
        issuerUpdationConfig
      );

      if (!addOidcIssuerDetails) {
        throw new InternalServerErrorException('Error in updating OIDC Issuer details in DB');
      }

      const url = await getAgentUrl(
        agentEndPoint,
        CommonConstants.OIDC_ISSUER_TEMPLATE,
        getIssuerDetails.publicIssuerId
      );
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

  async oidcIssuerGetById(issuerId: string, orgId: string): Promise<IssuerResponse> {
    try {
      const getIssuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!getIssuerDetails && getIssuerDetails.publicIssuerId) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.notFound);
      }
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const url = await getAgentUrl(
        agentDetails?.agentEndPoint,
        CommonConstants.OIDC_ISSUER_BY_ID,
        getIssuerDetails?.publicIssuerId
      );
      const issuerDetailsRaw = await this._oidcGetIssuerById(url, orgId);

      if (!issuerDetailsRaw) {
        throw new InternalServerErrorException(`Error from agent while getting issuer`);
      }

      // response is a string → parse it into IssuerResponse
      const issuerDetails = {
        response: JSON.parse(issuerDetailsRaw.response) as IssuerResponse
      };

      return issuerDetails.response;
    } catch (error) {
      this.logger.error(`[oidcIssuerGetById] - error in oidcIssuerGetById issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async oidcIssuers(orgId: string): Promise<IssuerResponse[]> {
    try {
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails?.agentEndPoint) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      const url = await getAgentUrl(agentDetails.agentEndPoint, CommonConstants.OIDC_GET_ALL_ISSUERS);
      const issuersDetails = await this._oidcGetIssuers(url, orgId);
      if (!issuersDetails || null == issuersDetails.response) {
        throw new InternalServerErrorException('Error from agent while oidcIssuers');
      }
      //TODO: Fix the response type from agent
      const raw = issuersDetails.response as unknown;
      const response: IssuerResponse[] =
        'string' === typeof raw ? (JSON.parse(raw) as IssuerResponse[]) : (raw as IssuerResponse[]);

      if (!Array.isArray(response)) {
        throw new InternalServerErrorException('Invalid issuer payload from agent');
      }

      return response;
    } catch (error: any) {
      const msg = error?.message ?? 'unknown error';
      this.logger.error(`[oidcIssuers] - error in oidcIssuers: ${msg}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async deleteOidcIssuer(orgId: string, userDetails: user, issuerId: string) {
    try {
      const deleteOidcIssuer = await this.issuanceRepository.deleteOidcIssuer(issuerId);
      if (!deleteOidcIssuer) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.deleteTemplate);
      }

      const issuerRecordId = await this.oidcIssuerGetById(issuerId, orgId);
      if (!issuerRecordId.id) {
        throw new NotFoundException(ResponseMessages.oidcIssuer.error.notFound);
      }
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;
      const issuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_DELETE, issuerRecordId.id);

      const createTemplateOnAgent = await this._deleteOidcIssuer(url, orgId);
      if (!createTemplateOnAgent) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      return deleteOidcIssuer;
    } catch (error) {
      this.logger.error(`[deleteTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async createTemplate(
    CredentialTemplate: CreateCredentialTemplate,
    orgId: string,
    issuerId: string
  ): Promise<credential_templates> {
    try {
      const { name, description, format, canBeRevoked, attributes, appearance, signerOption } = CredentialTemplate;
      const checkNameExist = await this.issuanceRepository.getTemplateByNameForIssuer(name, issuerId);
      if (0 < checkNameExist.length) {
        throw new ConflictException(ResponseMessages.oidcTemplate.error.templateNameAlreadyExist);
      }
      const metadata = {
        name,
        description,
        format,
        canBeRevoked,
        attributes,
        appearance: appearance ?? {},
        issuerId,
        signerOption
      };
      // Persist in DB
      const createdTemplate = await this.issuanceRepository.createTemplate(issuerId, metadata);
      if (!createdTemplate) {
        throw new InternalServerErrorException(ResponseMessages.oidcTemplate.error.createFailed);
      }
      const issuerTemplateConfig = await this.buildOidcIssuerConfig(issuerId);
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;
      const issuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, issuerDetails.publicIssuerId);
      const createTemplateOnAgent = await this._createOIDCTemplate(issuerTemplateConfig, url, orgId);
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
      const template = await this.issuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }
      if (updateCredentialTemplate.name) {
        const checkNameExist = await this.issuanceRepository.getTemplateByNameForIssuer(
          updateCredentialTemplate.name,
          issuerId
        );
        if (0 < checkNameExist.length) {
          throw new ConflictException(ResponseMessages.oidcTemplate.error.templateNameAlreadyExist);
        }
      }
      const normalized = {
        ...updateCredentialTemplate,
        ...(issuerId ? { issuerId } : {})
      };
      const { name, description, format, canBeRevoked, attributes, appearance } = normalized;

      const payload = {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(format !== undefined ? { format } : {}),
        ...(canBeRevoked !== undefined ? { canBeRevoked } : {}),
        ...(attributes !== undefined ? { attributes } : {}),
        ...(appearance !== undefined ? { appearance } : {}),
        ...(issuerId ? { issuerId } : {})
      };

      const updatedTemplate = await this.issuanceRepository.updateTemplate(templateId, payload);

      const templates = await this.issuanceRepository.getTemplatesByIssuerId(issuerId);
      if (!templates || 0 === templates.length) {
        throw new NotFoundException(ResponseMessages.issuance.error.notFound);
      }
      const issuerTemplateConfig = await this.buildOidcIssuerConfig(issuerId);
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;
      const issuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, issuerDetails.publicIssuerId);

      const createTemplateOnAgent = await this._createOIDCTemplate(issuerTemplateConfig, url, orgId);
      if (!createTemplateOnAgent) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
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
      const template = await this.issuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }
      const deleteTemplate = await this.issuanceRepository.deleteTemplate(templateId);
      if (!deleteTemplate) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.deleteTemplate);
      }

      const issuerTemplateConfig = await this.buildOidcIssuerConfig(issuerId);
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;
      const issuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_TEMPLATE, issuerDetails.publicIssuerId);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findByIdTemplate(templateId: string, orgId: string, userDetails: user, issuerId: string): Promise<any> {
    try {
      const template = await this.issuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }

      return { message: ResponseMessages.oidcTemplate.success.fetch, data: template };
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
      const getAllOfferTemplates = await this.issuanceRepository.getTemplateByIds(filterTemplateIds, issuerId);
      if (!getAllOfferTemplates) {
        throw new NotFoundException('No templates found for the issuer');
      }

      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      //TDOD: signerOption should be under credentials change this with x509 support
      const signerOption: SignerOption = {
        method: SignerMethodOption.DID,
        did: agentDetails.orgDid
      };
      const buildOidcCredentialOffer: CredentialOfferPayload = buildCredentialOfferPayload(
        createOidcCredentialOffer,
        getAllOfferTemplates,
        signerOption
      );
      if (!buildOidcCredentialOffer) {
        throw new BadRequestException('Error while creating oidc credential offer');
      }
      const issuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      if (!issuerDetails) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      }
      buildOidcCredentialOffer.publicIssuerId = issuerDetails.publicIssuerId;
      const url = await getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_ISSUER_SESSIONS_CREDENTIAL_OFFER,
        issuerDetails.publicIssuerId
      );

      const createCredentialOfferOnAgent = await this._oidcCreateCredentialOffer(buildOidcCredentialOffer, url, orgId);
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
      // TODO: Need to implement this in future if required

      // const filterTemplateIds = extractTemplateIds(updateOidcCredentialOffer);
      // console.log('This is the filterTemplateIds:', filterTemplateIds);
      // if (!filterTemplateIds) {
      //   throw new BadRequestException('Please provide a valid id');
      // }
      // const getAllOfferTemplates = await this.issuanceRepository.getTemplateByIds(filterTemplateIds, issuerId);
      // console.log('This is the getAllOfferTemplates:', getAllOfferTemplates);
      // if (!getAllOfferTemplates || getAllOfferTemplates.length === 0) {
      //   throw new NotFoundException('No templates found for the issuer');
      // }
      // const buildOidcUpdateCredentialOffer = buildUpdateCredentialOfferPayload(
      //   updateOidcCredentialOffer,
      //   getAllOfferTemplates
      // );
      // if (!buildOidcUpdateCredentialOffer) {
      //   throw new BadRequestException('Error while creating oidc credential offer');
      // }
      // const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      // if (!agentDetails) {
      //   throw new NotFoundException(ResponseMessages.oidcTemplate.error.issuerDetailsNotFound);
      // }
      //   const issuanceMetadata= {
      //     issuanceMetadata: {
      //     issuerDid: agentDetails.orgDid,
      //     credentials: buildOidcUpdateCredentialOffer.credentials
      //   }
      // }
      const url = await getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_ISSUER_SESSIONS_UPDATE_OFFER,
        updateOidcCredentialOffer.credentialOfferId
      );
      const updateCredentialOfferOnAgent = await this._oidcUpdateCredentialOffer(
        updateOidcCredentialOffer.issuerMetadata,
        url,
        orgId
      );
      console.log('This is the updateCredentialOfferOnAgent:', JSON.stringify(updateCredentialOfferOnAgent));
      if (!updateCredentialOfferOnAgent) {
        throw new NotFoundException(ResponseMessages.oidcIssuerSession.error.errorUpdateOffer);
      }

      return updateCredentialOfferOnAgent.response;
    } catch (error) {
      this.logger.error(`[createOidcCredentialOffer] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async getCredentialOfferDetailsById(offerId: string, orgId: string): Promise<any> {
    try {
      const url = await getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_ISSUER_SESSIONS_BY_ID,
        offerId
      );
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
      const url = await getAgentUrl(await this.getAgentEndpoint(orgId), CommonConstants.OIDC_ISSUER_SESSIONS);
      const credentialOfferUrl = buildCredentialOfferUrl(url, getAllCredentialOffer);
      console.log('This is credentialOfferUrl', credentialOfferUrl);
      const offers = await this._oidcGetCredentialOfferById(credentialOfferUrl, orgId);
      console.log('This is offer', JSON.stringify(offers, null, 2));
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
      const url = await getAgentUrl(
        await this.getAgentEndpoint(orgId),
        CommonConstants.OIDC_DELETE_CREDENTIAL_OFFER,
        credentialId
      );
      console.log('This is the url:', url);
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
      const issuerDetails = await this.issuanceRepository.getOidcIssuerDetailsById(issuerId);
      const templates = await this.issuanceRepository.getTemplatesByIssuerId(issuerId);

      const credentialConfigurationsSupported = buildCredentialConfigurationsSupported(templates);

      return buildIssuerPayload(credentialConfigurationsSupported, issuerDetails);
    } catch (error) {
      this.logger.error(`[buildOidcIssuerPayload] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findAllTemplate(orgId: string, userDetails: user, issuerId: string): Promise<any> {
    try {
      const templates = await this.issuanceRepository.getTemplatesByIssuerId(issuerId);
      return { message: ResponseMessages.oidcTemplate.success.fetch, data: templates };
    } catch (error) {
      this.logger.error(`[findAllTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _createOIDCIssuer(issuerCreation, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oidc-issuer' };
      const payload: IAgentOIDCIssuerCreate = { issuerCreation, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_createOIDCIssuer] [NATS call]- error in create OIDC Issuer : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _createOIDCTemplate(templatePayload, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oidc-template' };
      const payload = { templatePayload, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_createOIDCTemplate] [NATS call]- error in create OIDC Template : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _deleteOidcIssuer(url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'delete-oidc-issuer' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_createOIDCTemplate] [NATS call]- error in create OIDC Template : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _oidcGetIssuerById(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'oidc-get-issuer-by-id' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_oidcGetIssuerById] [NATS call]- error in oidc get issuer by id : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _oidcGetIssuers(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'oidc-get-issuers-agent-service' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_oidcGetIssuers] [NATS call]- error in oidc get issuers : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _oidcCreateCredentialOffer(credentialPayload: CredentialOfferPayload, url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oidc-create-credential-offer' };
      const payload = { credentialPayload, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcCreateCredentialOffer] [NATS call]- error in oidc create credential offer : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcUpdateCredentialOffer(issuanceMetadata, url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oidc-update-credential-offer' };
      const payload = { issuanceMetadata, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcUpdateCredentialOffer] [NATS call]- error in oidc update credential offer : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcGetCredentialOfferById(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oidc-get-credential-offer-by-id' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcGetCredentialOfferById] [NATS call]- error in oidc get credential offer by id : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcGetCredentialOffers(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oidc-get-credential-offers' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcGetCredentialOffers] [NATS call]- error in oidc get credential offers : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _oidcDeleteCredentialOffer(url: string, orgId: string) {
    try {
      const pattern = { cmd: 'agent-service-oidc-delete-credential-offer' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_oidcDeleteCredentialOffer] [NATS call]- error in oidc delete credential offer : ${JSON.stringify(error)}`
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
    const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);

    if (!agentDetails) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    if (!agentDetails.agentEndPoint || '' === agentDetails.agentEndPoint.trim()) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    return agentDetails.agentEndPoint;
  }
}
