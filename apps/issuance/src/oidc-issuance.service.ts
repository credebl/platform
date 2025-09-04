/* eslint-disable quotes */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
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
  IssuerUpdation
} from '../interfaces/oidc-issuance.interfaces';
import { UpdateCredentialTemplate } from '../interfaces/oidc-template.interface';
import {
  batchCredentialIssuanceDefault,
  credentialConfigurationsSupported,
  dpopSigningAlgValuesSupported
} from '../constant/issuance';
import { buildCredentialConfigurationsSupported, buildIssuerPayload } from '../libs/helpers/issuer.metadata';

type CredentialDisplayItem = {
  logo?: { uri: string; alt_text?: string };
  name: string;
  locale?: string;
  description?: string;
};

type Appearance = {
  credential_display: CredentialDisplayItem[];
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
      const { accessTokenSignerKeyType, issuerId, batchCredentialIssuanceSize } = issuerCreation;
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      console.log('issuerCreation::::', issuerCreation);
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
        authorizationServerConfigs: issuerCreation?.authorizationServerConfigs || {},
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
      this.logger.error(`[oidcIssuerCreate] - error in oidcIssuerCreate issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async createTemplate(CredentialTemplate, orgId: string, issuerId: string): Promise<credential_templates> {
    try {
      const { name, description, format, canBeRevoked, attributes, appearance } = CredentialTemplate;
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
        issuerId
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

      // const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      // const url = await getAgentUrl(agentDetails.agentEndPoint, CommonConstants.OIDC_TEMPLATE_DELETE);

      // await this._deleteOIDCTemplate(templateId, url, orgId);
      // TODO: Maybe add issuerId to all the queries as well, so that only templates related to specific issuers are deleted.
      // Maybe we can even include
      return await this.issuanceRepository.deleteTemplate(templateId);
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
}
