/* eslint-disable quotes */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IssuanceRepository } from './issuance.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import { getAgentUrl } from '@credebl/common/common.utils';
import { user } from '@prisma/client';
import { IAgentOIDCIssuerCreate, IssuerCreation } from '../interfaces/oidc-issuance.interfaces';
import { CreateCredentialTemplate, UpdateCredentialTemplate } from '../interfaces/oidc-template.interface';
@Injectable()
export class OIDCIssuanceService {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(
    @Inject('NATS_CLIENT') private readonly issuanceServiceProxy: ClientProxy,
    private readonly issuanceRepository: IssuanceRepository
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async oidcIssuerCreate(issuerCreation: IssuerCreation, orgId: string, userDetails: user): Promise<any> {
    try {
      // Get agent details
      const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint } = agentDetails;

      const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
      if (!orgAgentType) {
        throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
      }

      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_CREATE);

      // Call agent
      const createdIssuer = await this._createOIDCIssuer(issuerCreation, url, orgId);

      console.log('This is the created issuer', JSON.stringify(createdIssuer, null, 2));

      // Once issuer is created, add the data along with issuer details inside the table

      return 'issuer created successfully';
    } catch (error) {
      this.logger.error(`[oidcIssuerCreate] - error in deleting issuance records: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  // async oidcIssuerGet(orgId: string, userDetails: user, issuerId: string): Promise<any> {
  //   try {
  //     // Get agent details
  //     const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
  //     if (!agentDetails) {
  //       throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
  //     }
  //     const { agentEndPoint } = agentDetails;

  //     const orgAgentType = await this.issuanceRepository.getOrgAgentType(agentDetails?.orgAgentTypeId);
  //     if (!orgAgentType) {
  //       throw new NotFoundException(ResponseMessages.issuance.error.orgAgentTypeNotFound);
  //     }

  //     const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_ISSUER_GET, { issuerId });

  //     // Call agent to get issuer details
  //     const issuerDetails = await this._getOIDCIssuer(url, orgId, issuerId);
  //     if (!issuerDetails) {
  //       throw new NotFoundException(`OIDC Issuer with id ${issuerId} not found`);
  //     }

  //     // Fetch linked templates
  //     const templates = await this.issuanceRepository.getTemplatesByIssuer(issuerId);

  //     // Construct issuer metadata response
  //     const issuerMetadata = {
  //       ...issuerDetails.metadata,
  //       templates: templates.map(t => ({
  //         id: t.id,
  //         name: t.name,
  //         description: t.description,
  //         createdAt: t.createdAt,
  //         updatedAt: t.updatedAt,
  //       })),
  //     };

  //     return issuerMetadata;

  //   } catch (error) {
  //     this.logger.error(`[oidcIssuerGet] - error in fetching issuer: ${JSON.stringify(error)}`);
  //     throw new RpcException(error.response ? error.response : error);
  //   }
  // }

  // async createTemplate(dto: CreateCredentialTemplate, orgId: string, userDetails: user): Promise<any> {
  //   try {
  //     const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
  //     if (!agentDetails) throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);

  //     // const url = await getAgentUrl(agentDetails.agentEndPoint, CommonConstants.OIDC_TEMPLATE_CREATE);

  //     // // Call agent
  //     // const createdTemplate = await this._createOIDCTemplate(dto, url, orgId);

  //     // Persist details in DB
  //     await this.issuanceRepository.createTemplate(dto.issuerId, createdTemplate.metadata);

  //     return { message: ResponseMessages.oidcTemplate.success.create, data: createdTemplate };
  //   } catch (error) {
  //     this.logger.error(`[createTemplate] - error: ${JSON.stringify(error)}`);
  //     throw new RpcException(error.response ?? error);
  //   }
  // }

  // async updateTemplate(templateId: string, dto: UpdateCredentialTemplate, orgId: string, userDetails: user, issuerId: string): Promise<any> {
  //   try {
  //     const template = await this.issuanceRepository.getTemplateById(templateId);
  //     if (!template) throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);

  //     // const agentDetails = await this.issuanceRepository.getAgentEndPoint(orgId);
  //     // const url = await getAgentUrl(agentDetails.agentEndPoint, CommonConstants.OIDC_TEMPLATE_UPDATE);

  //     // const updatedTemplate = await this._updateOIDCTemplate(templateId, dto, url, orgId);
  //     await this.issuanceRepository.updateTemplate(templateId, updatedTemplate.metadata);

  //     return { message: ResponseMessages.oidcTemplate.success.update, data: updatedTemplate };
  //   } catch (error) {
  //     this.logger.error(`[updateTemplate] - error: ${JSON.stringify(error)}`);
  //     throw new RpcException(error.response ?? error);
  //   }
  // }

  async createTemplate(
    dto: CreateCredentialTemplate,
    orgId: string,
    userDetails: user,
    issuerId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    try {
      // console.log("REached here", JSON.stringify(dto, null, 2))
      // Prepare metadata in the expected schema
      const metadata = {
        name: dto.name,
        description: dto.description,
        format: dto.format,
        canBeRevoked: dto.canBeRevoked,
        attributes: dto.attributes,
        appearance: dto.appearance ?? {},
        // attributes: dto.attributes as Prisma.JsonValue,
        // appearance: (dto.appearance ?? {}) as Prisma.JsonValue,
        issuerId
        // createdBy: userDetails.id,
        // createdAt: new Date()
      };

      // console.log("REached here")

      // Persist in DB
      const createdTemplate = await this.issuanceRepository.createTemplate(dto.issuerId, metadata);

      return {
        message: ResponseMessages.oidcTemplate.success.create,
        data: createdTemplate
      };
    } catch (error) {
      this.logger.error(`[createTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  async updateTemplate(
    templateId: string,
    dto: UpdateCredentialTemplate,
    orgId: string,
    userDetails: user,
    issuerId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    try {
      const template = await this.issuanceRepository.getTemplateById(templateId);
      if (!template) {
        throw new NotFoundException(ResponseMessages.oidcTemplate.error.notFound);
      }

      // Merge old + new fields
      const updatedMetadata = {
        ...template,
        ...dto,
        updatedBy: userDetails.id
      };

      const updatedTemplate = await this.issuanceRepository.updateTemplate(templateId, updatedMetadata);

      return {
        message: ResponseMessages.oidcTemplate.success.update,
        data: updatedTemplate
      };
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
      await this.issuanceRepository.deleteTemplate(templateId);

      return { message: ResponseMessages.oidcTemplate.success.delete };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findAllTemplate(orgId: string, userDetails: user, issuerId: string): Promise<any> {
    try {
      const templates = await this.issuanceRepository.getTemplatesByIssuer(issuerId);
      return { message: ResponseMessages.oidcTemplate.success.fetch, data: templates };
    } catch (error) {
      this.logger.error(`[findAllTemplate] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ?? error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _createOIDCIssuer(issuerCreation: IssuerCreation, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oidc-issuer' };
      const payload: IAgentOIDCIssuerCreate = { issuerCreation, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_createOIDCIssuer] [NATS call]- error in create OIDC Issuer : ${JSON.stringify(error)}`);
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
