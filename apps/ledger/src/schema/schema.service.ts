/* eslint-disable camelcase */
import {
  BadRequestException,
  HttpException,
  Inject,
  ConflictException,
  Injectable,
  NotAcceptableException, NotFoundException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { SchemaRepository } from './repositories/schema.repository';
import { schema } from '@prisma/client';
import { ISchema, ISchemaCredDeffSearchInterface, ISchemaPayload, ISchemaSearchCriteria } from './interfaces/schema-payload.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { IUserRequestInterface } from './interfaces/schema.interface';
import { CreateSchemaAgentRedirection, GetSchemaAgentRedirection } from './schema.interface';
import { map } from 'rxjs/operators';
import { OrgAgentType } from '@credebl/enum/enum';
import { ICredDefWithPagination, ISchemaData, ISchemasWithPagination } from '@credebl/common/interfaces/schema.interface';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CommonConstants } from '@credebl/common/common.constant';

@Injectable()
export class SchemaService extends BaseService {
  constructor(
    private readonly schemaRepository: SchemaRepository,
    @Inject('NATS_CLIENT') private readonly schemaServiceProxy: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {
    super('SchemaService');
  }

  async createSchema(
    schema: ISchemaPayload,
    user: IUserRequestInterface,
    orgId: string
  ): Promise<ISchemaData> {

    let apiKey: string = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
    if (!apiKey || null === apiKey || undefined === apiKey) {
      apiKey = await this._getOrgAgentApiKey(orgId);
    }
    const { userId } = user.selectedOrg;
    try {

      const schemaExists = await this.schemaRepository.schemaExists(
        schema.schemaName,
        schema.schemaVersion
        );
        
        if (0 !== schemaExists.length) {
          this.logger.error(ResponseMessages.schema.error.exists);
          throw new ConflictException(
            ResponseMessages.schema.error.exists,
            { cause: new Error(), description: ResponseMessages.errorMessages.conflict }
          );
        }
        
        if (null !== schema || schema !== undefined) {
          const schemaVersionIndexOf = -1;
          if (
          isNaN(parseFloat(schema.schemaVersion)) ||
          schema.schemaVersion.toString().indexOf('.') ===
          schemaVersionIndexOf
        ) {
          throw new NotAcceptableException(
            ResponseMessages.schema.error.invalidVersion,
            { cause: new Error(), description: ResponseMessages.errorMessages.notAcceptable }
          );
        }

        const schemaAttributeLength = 0;
        if (schema.attributes.length === schemaAttributeLength) {
            throw new NotAcceptableException(
              ResponseMessages.schema.error.insufficientAttributes,
              { cause: new Error(), description: ResponseMessages.errorMessages.notAcceptable }
            );
          } else if (schema.attributes.length > schemaAttributeLength) {
            
            const trimmedAttributes = schema.attributes.map(attribute => ({
              attributeName: attribute.attributeName.trim(),
              schemaDataType: attribute.schemaDataType,
              displayName: attribute.displayName.trim()
            }));


          const attributeNamesLowerCase = trimmedAttributes.map(attribute => attribute.attributeName.toLowerCase());
          const duplicateAttributeNames = attributeNamesLowerCase
            .filter((value, index, element) => element.indexOf(value) !== index);

        if (0 < duplicateAttributeNames.length) {
            throw new ConflictException(
              ResponseMessages.schema.error.uniqueAttributesnames,
              { cause: new Error(), description: ResponseMessages.errorMessages.conflict }
            );
        }

          const attributeDisplayNamesLowerCase = trimmedAttributes.map(attribute => attribute.displayName.toLocaleLowerCase());
          const duplicateAttributeDisplayNames = attributeDisplayNamesLowerCase
            .filter((value, index, element) => element.indexOf(value) !== index);

        if (0 < duplicateAttributeDisplayNames.length) {
            throw new ConflictException(
              ResponseMessages.schema.error.uniqueAttributesDisplaynames,
              { cause: new Error(), description: ResponseMessages.errorMessages.conflict }
            );
        }

          schema.schemaName = schema.schemaName.trim();
          const agentDetails = await this.schemaRepository.getAgentDetailsByOrgId(orgId);
          if (!agentDetails) {
            throw new NotFoundException(
              ResponseMessages.schema.error.agentDetailsNotFound,
              { cause: new Error(), description: ResponseMessages.errorMessages.notFound }
            );
          }
          const { agentEndPoint, orgDid } = agentDetails;
          const getAgentDetails = await this.schemaRepository.getAgentType(orgId);
          // eslint-disable-next-line yoda
          const did = schema.orgDid?.split(':').length >= 4 ? schema.orgDid : orgDid;

          const orgAgentType = await this.schemaRepository.getOrgAgentType(getAgentDetails.org_agents[0].orgAgentTypeId);
          const attributeArray = trimmedAttributes.map(item => item.attributeName);
          let schemaResponseFromAgentService;
          if (OrgAgentType.DEDICATED === orgAgentType) {
            const issuerId = did;

            const schemaPayload = {
              attributes: attributeArray,
              version: schema.schemaVersion,
              name: schema.schemaName,
              issuerId,
              agentEndPoint,
              apiKey,
              agentType: OrgAgentType.DEDICATED
            };
            schemaResponseFromAgentService = await this._createSchema(schemaPayload);

          } else if (OrgAgentType.SHARED === orgAgentType) {
            const { tenantId } = await this.schemaRepository.getAgentDetailsByOrgId(orgId);

            const schemaPayload = {
              tenantId,
              method: 'registerSchema',
              payload: {
                attributes: attributeArray,
                version: schema.schemaVersion,
                name: schema.schemaName,
                issuerId: did
              },
              agentEndPoint,
              apiKey,
              agentType: OrgAgentType.SHARED
            };
            schemaResponseFromAgentService = await this._createSchema(schemaPayload);
          }

          const responseObj = JSON.parse(JSON.stringify(schemaResponseFromAgentService.response));

          const indyNamespace = `${did.split(':')[2]}:${did.split(':')[3]}`;
          const getLedgerId = await this.schemaRepository.getLedgerByNamespace(indyNamespace);
          const schemaDetails: ISchema = {
            schema: { schemaName: '', attributes: [], schemaVersion: '', id: '' },
            createdBy: `0`,
            issuerId: '',
            onLedgerStatus: 'Submitted on ledger',
            orgId,
            ledgerId: getLedgerId.id
          };

          if ('finished' === responseObj.schema.state) {
            schemaDetails.schema.schemaName = responseObj.schema.schema.name;
            schemaDetails.schema.attributes = trimmedAttributes;
            schemaDetails.schema.schemaVersion = responseObj.schema.schema.version;
            schemaDetails.createdBy = userId;
            schemaDetails.schema.id = responseObj.schema.schemaId;
            schemaDetails.changedBy = userId;
            schemaDetails.orgId = orgId;
            schemaDetails.issuerId = responseObj.schema.schema.issuerId;
            const saveResponse = this.schemaRepository.saveSchema(
              schemaDetails
            );

            const attributesArray = JSON.parse((await saveResponse).attributes);
            (await saveResponse).attributes = attributesArray;
            return saveResponse;

          } else if ('finished' === responseObj.state) {
            schemaDetails.schema.schemaName = responseObj.schema.name;
            schemaDetails.schema.attributes = trimmedAttributes;
            schemaDetails.schema.schemaVersion = responseObj.schema.version;
            schemaDetails.createdBy = userId;
            schemaDetails.schema.id = responseObj.schemaId;
            schemaDetails.changedBy = userId;
            schemaDetails.orgId = orgId;
            schemaDetails.issuerId = responseObj.schema.issuerId;
            const saveResponse = this.schemaRepository.saveSchema(
              schemaDetails
            );

            const attributesArray = JSON.parse((await saveResponse).attributes);
            (await saveResponse).attributes = attributesArray;
            return saveResponse;

          } else {
            throw new NotFoundException(
              ResponseMessages.schema.error.notCreated,
              { cause: new Error(), description: ResponseMessages.errorMessages.notFound }
            );
          }
        } else {
          throw new BadRequestException(
            ResponseMessages.schema.error.emptyData,
            { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
          );
        }
      } else {       
        throw new BadRequestException(
          ResponseMessages.schema.error.emptyData,
          { cause: new Error(), description: ResponseMessages.errorMessages.badRequest }
        );
      }
    } catch (error) {
      this.logger.error(
        `[createSchema] - outer Error: ${JSON.stringify(error)}`
      );

      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _createSchema(payload: CreateSchemaAgentRedirection): Promise<{
    response: string;
  }> {
      const pattern = {
        cmd: 'agent-create-schema'
      };
      const schemaResponse = await this.schemaServiceProxy
        .send(pattern, payload)
        .pipe(
          map((response) => (
            {
              response
            }))
        ).toPromise()
        .catch(error => {
          this.logger.error(`Error in creating schema : ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,  
              error: error.error,
              message: error.message
            }, error.error);
        });
      return schemaResponse;  
  }


  async getSchemaById(schemaId: string, orgId: string): Promise<schema> {
    try {
      const { agentEndPoint } = await this.schemaRepository.getAgentDetailsByOrgId(orgId);
      const getAgentDetails = await this.schemaRepository.getAgentType(orgId);
      const orgAgentType = await this.schemaRepository.getOrgAgentType(getAgentDetails.org_agents[0].orgAgentTypeId);
      // const apiKey = '';

      let apiKey;
      apiKey = await this.cacheService.get(CommonConstants.CACHE_APIKEY_KEY);
      if (!apiKey || null === apiKey || undefined === apiKey) {
        apiKey = await this._getOrgAgentApiKey(orgId);

      }

      let schemaResponse;
      if (OrgAgentType.DEDICATED === orgAgentType) {
        const getSchemaPayload = {
          schemaId,
          apiKey,
          agentEndPoint,
          agentType: OrgAgentType.DEDICATED
        };
        schemaResponse = await this._getSchemaById(getSchemaPayload);
      } else if (OrgAgentType.SHARED === orgAgentType) {
        const { tenantId } = await this.schemaRepository.getAgentDetailsByOrgId(orgId);
        const getSchemaPayload = {
          tenantId,
          method: 'getSchemaById',
          payload: { schemaId },
          agentType: OrgAgentType.SHARED,
          agentEndPoint,
          apiKey
        };
        schemaResponse = await this._getSchemaById(getSchemaPayload);
      }
      return schemaResponse.response;

    } catch (error) {
      this.logger.error(`Error in getting schema by id: ${error}`);
      if (error && error?.status && error?.status?.message && error?.status?.message?.error) {
        throw new RpcException({
          message: error?.status?.message?.error?.reason ? error?.status?.message?.error?.reason : error?.status?.message?.error,
          statusCode: error?.status?.code
        });

      } else {
        throw new RpcException(error.response ? error.response : error);
      }
    }
  }

  async _getSchemaById(payload: GetSchemaAgentRedirection): Promise<{ response: string }> {
    try {
      const pattern = {
        cmd: 'agent-get-schema'
      };
      const schemaResponse = await this.schemaServiceProxy
        .send(pattern, payload)
        .pipe(
          map((response) => (
            {
              response
            }))
        ).toPromise()
        .catch(error => {
          this.logger.error(`Catch : ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            }, error.error);
        });
      return schemaResponse;
    } catch (error) {
      this.logger.error(`Error in getting schema : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getSchemas(schemaSearchCriteria: ISchemaSearchCriteria, orgId: string): Promise<ISchemasWithPagination> {
    try {
      const response = await this.schemaRepository.getSchemas(schemaSearchCriteria, orgId);

      if (0 === response.schemasCount) {
        throw new NotFoundException(ResponseMessages.schema.error.notFound);
      } 
      
      const schemasDetails = response?.schemasResult.map(schemaAttributeItem => {
        const attributes = JSON.parse(schemaAttributeItem.attributes);
        return { ...schemaAttributeItem, attributes };
      });

      const nextPage:number = Number(schemaSearchCriteria.pageNumber) + 1;      

      const schemasResponse: ISchemasWithPagination = {
        totalItems: response.schemasCount,
        hasNextPage: schemaSearchCriteria.pageSize * schemaSearchCriteria.pageNumber < response.schemasCount,
        hasPreviousPage: 1 < schemaSearchCriteria.pageNumber,
        nextPage,
        previousPage: schemaSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(response.schemasCount / schemaSearchCriteria.pageSize),
        data: schemasDetails
      };

      return schemasResponse;

    } catch (error) {
      this.logger.error(`Error in retrieving schemas by org id: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getcredDeffListBySchemaId(
    payload: ISchemaCredDeffSearchInterface
    ): Promise<ICredDefWithPagination> {
    const { schemaSearchCriteria } = payload;
    
    try {
      const response = await this.schemaRepository.getSchemasCredDeffList(schemaSearchCriteria);
      
      if (0 === response.credDefCount) {
        throw new NotFoundException(ResponseMessages.schema.error.credentialDefinitionNotFound);
      } 

      const schemasResponse = {
        totalItems: response.credDefCount,
        hasNextPage: schemaSearchCriteria.pageSize * schemaSearchCriteria.pageNumber < response.credDefCount,
        hasPreviousPage: 1 < schemaSearchCriteria.pageNumber,
        nextPage: schemaSearchCriteria.pageNumber + 1,
        previousPage: schemaSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(response.credDefCount / schemaSearchCriteria.pageSize),
        data: response.credDefResult
      };

      return schemasResponse;

    } catch (error) {
      this.logger.error(`Error in retrieving credential definition: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getAllSchema(schemaSearchCriteria: ISchemaSearchCriteria): Promise<{
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number;
    previousPage: number;
    lastPage: number;
    data: {
      createDateTime: Date;
      createdBy: string;
      name: string;
      schemaLedgerId: string;
      version: string;
      attributes: string;
      publisherDid: string;
      issuerId: string;
    }[];
  }> {
    try {
      const response = await this.schemaRepository.getAllSchemaDetails(schemaSearchCriteria);

      const schemasDetails = response?.schemasResult.map(schemaAttributeItem => {
        const attributes = JSON.parse(schemaAttributeItem.attributes);
        return { ...schemaAttributeItem, attributes };
      });

      const schemasResponse = {
        totalItems: response.schemasCount,
        hasNextPage: schemaSearchCriteria.pageSize * schemaSearchCriteria.pageNumber < response.schemasCount,
        hasPreviousPage: 1 < schemaSearchCriteria.pageNumber,
        nextPage: schemaSearchCriteria.pageNumber + 1,
        previousPage: schemaSearchCriteria.pageNumber - 1,
        lastPage: Math.ceil(response.schemasCount / schemaSearchCriteria.pageSize),
        data: schemasDetails
      };

      if (0 !== response.schemasCount) {
        return schemasResponse;
      } else {
        throw new NotFoundException(ResponseMessages.schema.error.notFound);
      }


    } catch (error) {
      this.logger.error(`Error in retrieving all schemas: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async _getOrgAgentApiKey(orgId: string): Promise<string> {
    const pattern = { cmd: 'get-org-agent-api-key' };
    const payload = { orgId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = await this.schemaServiceProxy.send<any>(pattern, payload).toPromise();
      return message;
    } catch (error) {
      this.logger.error(`catch: ${JSON.stringify(error)}`);
      throw new HttpException({
        status: error.status,
        error: error.message
      }, error.status);
    }
  }


}
