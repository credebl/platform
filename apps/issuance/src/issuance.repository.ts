/* eslint-disable camelcase */
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { agent_invitations, credentials, file_data, file_upload, org_agents, organisation, platform_config, shortening_url } from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import { FileUpload, FileUploadData, SchemaDetails } from '../interfaces/issuance.interfaces';
@Injectable()
export class IssuanceRepository {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: Logger
    ) { }

    /**
     * Description: Get getAgentEndPoint by orgId
     * @param connectionId 
     * @returns Get getAgentEndPoint details
     */
    // eslint-disable-next-line camelcase
    async getAgentEndPoint(orgId: number): Promise<org_agents> {
        try {

            const agentDetails = await this.prisma.org_agents.findFirst({
                where: {
                    orgId
                }
            });

            if (!agentDetails) {
                throw new NotFoundException(ResponseMessages.issuance.error.notFound);
            }

            return agentDetails;

        } catch (error) {
            this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
            throw error;
        }
    }


    /**
 * Description: save credentials 
 * @param connectionId 
 * @returns Get saved credential details
 */
    // eslint-disable-next-line camelcase
    async saveIssuedCredentialDetails(createDateTime: string, connectionId: string, threadId: string, protocolVersion: string, credentialAttributes: object[], orgId: number): Promise<credentials> {
        try {

            const credentialDetails = await this.prisma.credentials.upsert({
                where: {
                    connectionId
                },
                update: {
                    lastChangedBy: orgId,
                    createDateTime,
                    threadId,
                    protocolVersion,
                    credentialAttributes,
                    orgId
                },
                create: {
                    createDateTime,
                    lastChangedBy: orgId,
                    connectionId,
                    threadId,
                    protocolVersion,
                    credentialAttributes,
                    orgId
                }
            });
            return credentialDetails;

        } catch (error) {
            this.logger.error(`Error in get saveIssuedCredentialDetails: ${error.message} `);
            throw error;
        }
    }

    /**
       * Description: Save connection details
       * @param connectionInvitation
       * @param agentId
       * @param orgId
       * @returns Get connection details
       */
    // eslint-disable-next-line camelcase
    async saveAgentConnectionInvitations(connectionInvitation: string, agentId: number, orgId: number): Promise<agent_invitations> {
        try {

            const agentInvitationData = await this.prisma.agent_invitations.create({
                data: {
                    orgId,
                    agentId,
                    connectionInvitation,
                    multiUse: true
                }
            });
            return agentInvitationData;
        } catch (error) {
            this.logger.error(`Error in saveAgentConnectionInvitations: ${error.message} `);
            throw error;
        }
    }

    /**
      * Description: Save ShorteningUrl details
      * @param referenceId
      * @param connectionInvitationUrl
      * @returns Get storeShorteningUrl details
      */
    // eslint-disable-next-line camelcase
    async storeShorteningUrl(referenceId: string, connectionInvitationUrl: string): Promise<shortening_url> {
        try {

            const createShorteningUrl = await this.prisma.shortening_url.create({
                data: {
                    referenceId,
                    url: connectionInvitationUrl,
                    type: null
                }
            });
            return createShorteningUrl;
        } catch (error) {
            this.logger.error(`Error in saveAgentConnectionInvitations: ${error.message} `);
            throw error;
        }
    }

    /**
   * Get platform config details
   * @returns 
   */
    // eslint-disable-next-line camelcase
    async getPlatformConfigDetails(): Promise<platform_config> {
        try {

            return this.prisma.platform_config.findFirst();

        } catch (error) {
            this.logger.error(`[getPlatformConfigDetails] - error: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    /**
    * Get organization details
    * @returns 
    */
    async getOrganization(orgId: number): Promise<organisation> {
        try {

            const organizationDetails = await this.prisma.organisation.findUnique({ where: { id: orgId } });
            return organizationDetails;

        } catch (error) {
            this.logger.error(`[getOrganization] - error: ${JSON.stringify(error)}`);
            throw new InternalServerErrorException(error);
        }
    }

    async getCredentialDefinitionDetails(credentialDefinitionId: string): Promise<SchemaDetails> {
        try {
            const credentialDefinitionDetails = await this.prisma.credential_definition.findFirst({
                where: {
                    credentialDefinitionId
                }
            });

            if (!credentialDefinitionDetails) {
                throw new NotFoundException(`Credential definition not found for ID: ${credentialDefinitionId}`);
            }

            const schemaDetails = await this.prisma.schema.findFirst({
                where: {
                    schemaLedgerId: credentialDefinitionDetails.schemaLedgerId
                }
            });

            if (!schemaDetails) {
                throw new NotFoundException(`Schema not found for credential definition ID: ${credentialDefinitionId}`);
            }

            const credentialDefRes = {
                credentialDefinitionId: credentialDefinitionDetails.credentialDefinitionId,
                tag: credentialDefinitionDetails.tag,
                schemaLedgerId: schemaDetails.schemaLedgerId,
                attributes: schemaDetails.attributes
            };

            return credentialDefRes;
        } catch (error) {
            this.logger.error(`Error in getCredentialDefinitionDetails: ${error.message}`);
            throw new InternalServerErrorException(error.message);
        }
    }

    async saveFileUploadDetails(fileUploadPayload: FileUpload): Promise<file_upload> {
        try {
            const { name, orgId, status, upload_type } = fileUploadPayload;
            return this.prisma.file_upload.create({
                data: {
                    name,
                    orgId: `${orgId}`,
                    status,
                    upload_type
                }
            });

        } catch (error) {
            this.logger.error(`[saveFileUploadDetails] - error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async updateFileUploadDetails(fileId: string, fileUploadPayload: FileUpload): Promise<file_upload> {
        try {
            const { name, orgId, status, upload_type } = fileUploadPayload;
            return this.prisma.file_upload.update({
                where: {
                    id: fileId
                },
                data: {
                    name,
                    orgId: `${orgId}`,
                    status,
                    upload_type
                }
            });

        } catch (error) {
            this.logger.error(`[updateFileUploadDetails] - error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async saveFileUploadData(fileUploadData: FileUploadData): Promise<file_data> {
        try {
            const { fileUpload, isError, referenceId, error, detailError } = fileUploadData;
            return this.prisma.file_data.create({
                data: {
                    detailError,
                    error,
                    isError,
                    referenceId,
                    fileUploadId: fileUpload
                }
            });

        } catch (error) {
            this.logger.error(`[saveFileUploadData] - error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}