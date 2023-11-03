/* eslint-disable camelcase */
import {
    ConflictException,
    HttpException,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { CredentialDefinitionRepository } from './repositories/credential-definition.repository';
import { CreateCredDefPayload, CredDefPayload, GetAllCredDefsPayload, GetCredDefBySchemaId, GetCredDefPayload } from './interfaces/create-credential-definition.interface';
import { credential_definition } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CreateCredDefAgentRedirection, CredDefSchema, GetCredDefAgentRedirection } from './interfaces/credential-definition.interface';
import { map } from 'rxjs/operators';

@Injectable()
export class CredentialDefinitionService extends BaseService {
    constructor(
        private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
        @Inject('NATS_CLIENT') private readonly credDefServiceProxy: ClientProxy

    ) {
        super('CredentialDefinitionService');
    }

    async createCredentialDefinition(payload: CreateCredDefPayload): Promise<credential_definition> {
        try {
            const { credDef, user } = payload;
            const { agentEndPoint, orgDid } = await this.credentialDefinitionRepository.getAgentDetailsByOrgId(credDef.orgId);
            // eslint-disable-next-line yoda
            const did = credDef.orgDid?.split(':').length >= 4 ? credDef.orgDid : orgDid;
            const getAgentDetails = await this.credentialDefinitionRepository.getAgentType(credDef.orgId);
            const apiKey = '';
            const { userId } = user.selectedOrg;
            credDef.tag = credDef.tag.trim();
            const dbResult: credential_definition = await this.credentialDefinitionRepository.getByAttribute(
                credDef.schemaLedgerId,
                credDef.tag
            );

            if (dbResult) {
                throw new ConflictException(ResponseMessages.credentialDefinition.error.Conflict);
            }
            let credDefResponseFromAgentService;
            if (`1` === getAgentDetails.org_agents[0].orgAgentTypeId) {
                const CredDefPayload = {
                    tag: credDef.tag,
                    schemaId: credDef.schemaLedgerId,
                    issuerId: did,
                    agentEndPoint,
                    apiKey,
                    agentType: `1`
                };
               
                credDefResponseFromAgentService = await this._createCredentialDefinition(CredDefPayload);

            } else if (`2` === getAgentDetails.org_agents[0].orgAgentTypeId) {
                const { tenantId } = await this.credentialDefinitionRepository.getAgentDetailsByOrgId(credDef.orgId);

                const CredDefPayload = {
                    tenantId,
                    method: 'registerCredentialDefinition',
                    payload: {
                        tag: credDef.tag,
                        schemaId: credDef.schemaLedgerId,
                        issuerId: did
                    },
                    agentEndPoint,
                    apiKey,
                    agentType: `2`
                };
                credDefResponseFromAgentService = await this._createCredentialDefinition(CredDefPayload);
            }
            const response = JSON.parse(JSON.stringify(credDefResponseFromAgentService.response));
            const schemaDetails = await this.credentialDefinitionRepository.getSchemaById(credDef.schemaLedgerId);
            if (!schemaDetails) {
                throw new NotFoundException(ResponseMessages.credentialDefinition.error.schemaIdNotFound);
            }
            const credDefData: CredDefPayload = {
                tag: '',
                schemaLedgerId: '',
                issuerId: '',
                revocable: credDef.revocable,
                createdBy: `0`,
                orgId: '0',
                schemaId: '0',
                credentialDefinitionId: ''
            };

            if ('finished' === response.state) {
                credDefData.tag = response.credentialDefinition.tag;
                credDefData.schemaLedgerId = response.credentialDefinition.schemaId;
                credDefData.issuerId = response.credentialDefinition.issuerId;
                credDefData.credentialDefinitionId = response.credentialDefinitionId;
                credDefData.orgId = credDef.orgId;
                credDefData.revocable = credDef.revocable;
                credDefData.schemaId = schemaDetails.id;
                credDefData.createdBy = userId;
            } else if ('finished' === response.credentialDefinition.state) {
                credDefData.tag = response.credentialDefinition.credentialDefinition.tag;
                credDefData.schemaLedgerId = response.credentialDefinition.credentialDefinition.schemaId;
                credDefData.issuerId = response.credentialDefinition.credentialDefinition.issuerId;
                credDefData.credentialDefinitionId = response.credentialDefinition.credentialDefinitionId;
                credDefData.orgId = credDef.orgId;
                credDefData.revocable = credDef.revocable;
                credDefData.schemaId = schemaDetails.id;
                credDefData.createdBy = userId;
            }
            const credDefResponse = await this.credentialDefinitionRepository.saveCredentialDefinition(credDefData);
            return credDefResponse;

        } catch (error) {
            this.logger.error(
                `Error in creating credential definition: ${JSON.stringify(error)}`
            );
            throw new RpcException(error.response ? error.response : error);
        }
    }

    async _createCredentialDefinition(payload: CreateCredDefAgentRedirection): Promise<{
        response: string;
    }> {
        try {
            const pattern = {
                cmd: 'agent-create-credential-definition'
            };
           
            const credDefResponse = await this.credDefServiceProxy
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
            return credDefResponse;
        } catch (error) {
            this.logger.error(`Error in creating credential definition : ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getCredentialDefinitionById(payload: GetCredDefPayload): Promise<credential_definition> {
        try {
            const { credentialDefinitionId, orgId } = payload;
            const { agentEndPoint } = await this.credentialDefinitionRepository.getAgentDetailsByOrgId(String(orgId));
            const getAgentDetails = await this.credentialDefinitionRepository.getAgentType(String(orgId));
            const apiKey = '';
            let credDefResponse;
            if (`1` === getAgentDetails.org_agents[0].orgAgentTypeId) {
                const getSchemaPayload = {
                    credentialDefinitionId,
                    apiKey,
                    agentEndPoint,
                    agentType: `1`
                };
                credDefResponse = await this._getCredentialDefinitionById(getSchemaPayload);
            } else if (`2` === getAgentDetails.org_agents[0].orgAgentTypeId) {
                const { tenantId } = await this.credentialDefinitionRepository.getAgentDetailsByOrgId(String(orgId));
                const getSchemaPayload = {
                    tenantId,
                    method: 'getCredentialDefinitionById',
                    payload: { credentialDefinitionId },
                    agentType: `2`,
                    agentEndPoint
                };
                credDefResponse = await this._getCredentialDefinitionById(getSchemaPayload);
            }
            if (credDefResponse.response.resolutionMetadata.error) {
                throw new NotFoundException(ResponseMessages.credentialDefinition.error.credDefIdNotFound);
            }
            return credDefResponse;
        } catch (error) {
            this.logger.error(`Error retrieving credential definition with id ${payload.credentialDefinitionId}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }

    async _getCredentialDefinitionById(payload: GetCredDefAgentRedirection): Promise<{
        response: string;
    }> {
        try {
            const pattern = {
                cmd: 'agent-get-credential-definition'
            };
            const credDefResponse = await this.credDefServiceProxy
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
            return credDefResponse;
        } catch (error) {
            this.logger.error(`Error in creating credential definition : ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async getAllCredDefs(payload: GetAllCredDefsPayload): Promise<{
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number;
        previousPage: number;
        lastPage: number;
        data: {
            createDateTime: Date;
            createdBy: string;
            credentialDefinitionId: string;
            tag: string;
            schemaLedgerId: string;
            schemaId: string;
            orgId: string;
            revocable: boolean;
        }[]
    }> {
        try {
            const { credDefSearchCriteria, orgId } = payload;
            const response = await this.credentialDefinitionRepository.getAllCredDefs(credDefSearchCriteria, orgId);
            const credDefResponse = {
                totalItems: response.length,
                hasNextPage: credDefSearchCriteria.pageSize * credDefSearchCriteria.pageNumber < response.length,
                hasPreviousPage: 1 < credDefSearchCriteria.pageNumber,
                nextPage: credDefSearchCriteria.pageNumber + 1,
                previousPage: credDefSearchCriteria.pageNumber - 1,
                lastPage: Math.ceil(response.length / credDefSearchCriteria.pageSize),
                data: response
            };

            if (0 == response.length) {
                throw new NotFoundException(ResponseMessages.credentialDefinition.error.NotFound);
            }
            return credDefResponse;

        } catch (error) {
            this.logger.error(`Error in retrieving credential definitions: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }

    async getCredentialDefinitionBySchemaId(payload: GetCredDefBySchemaId): Promise<credential_definition[]> {
        try {
            const { schemaId } = payload;
            const credDefListBySchemaId = await this.credentialDefinitionRepository.getCredentialDefinitionBySchemaId(schemaId);
            return credDefListBySchemaId;
        } catch (error) {
            this.logger.error(`Error in retrieving credential definitions: ${error}`);
            throw new RpcException(error.response ? error.response : error);
        }
    }

    async getAllCredDefAndSchemaForBulkOperation(orgId: number): Promise<CredDefSchema[]> {
        try {
            const payload = {
                orgId,
                sortValue: 'ASC',
                credDefSortBy: 'id'
            };

            const credDefSchemaList: CredDefSchema[] =
                await this.credentialDefinitionRepository.getAllCredDefsByOrgIdForBulk(
                    payload
                );
                if (!credDefSchemaList) {
                    throw new NotFoundException(ResponseMessages.credentialDefinition.error.NotFound);
                }    
            return credDefSchemaList;
        } catch (error) {
            this.logger.error(
                `get Cred-Defs and schema List By OrgId for bulk operations: ${JSON.stringify(error)}`
            );
            throw new RpcException(error.response);
        }
    }

}