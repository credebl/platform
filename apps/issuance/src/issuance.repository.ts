/* eslint-disable camelcase */
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import {
  agent_invitations,
  credentials,
  file_data,
  file_upload,
  org_agents,
  organisation,
  platform_config,
  shortening_url
} from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import {
  FileUploadData,
  IssueCredentialWebhookPayload,
  PreviewRequest,
  SchemaDetails
} from '../interfaces/issuance.interfaces';
import { FileUploadStatus } from 'apps/api-gateway/src/enum';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IIssuedCredentialSearchParams } from 'apps/api-gateway/src/issuance/interfaces';
import { SortValue } from '@credebl/enum/enum';
@Injectable()
export class IssuanceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   * Description: Get getAgentEndPoint by orgId
   * @param connectionId
   * @returns Get getAgentEndPoint details
   */
  // eslint-disable-next-line camelcase
  async getAgentEndPoint(orgId: string): Promise<org_agents> {
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

  async getOrganizationByTenantId(tenantId: string): Promise<org_agents> {
    try {
      return this.prisma.org_agents.findFirst({
        where: {
          tenantId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getOrganization in issuance repository: ${error.message} `);
      throw error;
    }
  }

  async getAllIssuedCredentials(
    user: IUserRequest,
    orgId: string,
    issuedCredentialsSearchCriteria: IIssuedCredentialSearchParams
  ): Promise<{
    issuedCredentialsCount: number;
    issuedCredentialsList: {
      createDateTime: Date;
      createdBy: string;
      connectionId: string;
      schemaId: string;
      state: string;
      orgId: string;
    }[];
  }> {
    try {
      const issuedCredentialsList = await this.prisma.credentials.findMany({
        where: {
          orgId,
          OR: [
            { schemaId: { contains: issuedCredentialsSearchCriteria.searchByText, mode: 'insensitive' } },
            { connectionId: { contains: issuedCredentialsSearchCriteria.searchByText, mode: 'insensitive' } }
          ]
        },
        select: {
          createDateTime: true,
          createdBy: true,
          orgId: true,
          state: true,
          schemaId: true,
          connectionId: true
        },
        orderBy: {
          [issuedCredentialsSearchCriteria?.sortField]:
            SortValue.DESC === issuedCredentialsSearchCriteria?.sortBy ? 'desc' : 'asc'
        },
        take: Number(issuedCredentialsSearchCriteria.pageSize),
        skip: (issuedCredentialsSearchCriteria.pageNumber - 1) * issuedCredentialsSearchCriteria.pageSize
      });
     
      const issuedCredentialsCount = await this.prisma.credentials.count({
        where: {
          orgId,
          OR: [
            { schemaId: { contains: issuedCredentialsSearchCriteria.searchByText, mode: 'insensitive' } },
            { connectionId: { contains: issuedCredentialsSearchCriteria.searchByText, mode: 'insensitive' } }
          ]
        }
      });

      return { issuedCredentialsCount, issuedCredentialsList };
    } catch (error) {
      this.logger.error(`[getAllredentials] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Description: save credentials
   * @param connectionId
   * @returns Get saved credential details
   */
  // eslint-disable-next-line camelcase
  async saveIssuedCredentialDetails(payload: IssueCredentialWebhookPayload): Promise<credentials> {
    try {
      let organisationId: string;
      const { issueCredentialDto, id } = payload;

      if (issueCredentialDto?.contextCorrelationId) {
        const getOrganizationId = await this.getOrganizationByTenantId(issueCredentialDto?.contextCorrelationId);
        organisationId = getOrganizationId?.orgId;
      } else {
        organisationId = id;
      }

      let schemaId = '';

      if (issueCredentialDto?.metadata?.['_anoncreds/credential']?.schemaId) {
        schemaId = issueCredentialDto?.metadata?.['_anoncreds/credential']?.schemaId;
      } 
    
      let credDefId = '';
      if (issueCredentialDto?.metadata?.['_anoncreds/credential']?.credentialDefinitionId) {
        credDefId = issueCredentialDto?.metadata?.['_anoncreds/credential']?.credentialDefinitionId;
      }

      const credentialDetails = await this.prisma.credentials.upsert({
        where: { 
          threadId: issueCredentialDto?.threadId
        },
        update: {
          lastChangedBy: organisationId,
          createDateTime: issueCredentialDto?.createDateTime,
          threadId: issueCredentialDto?.threadId,
          connectionId: issueCredentialDto?.connectionId,
          state: issueCredentialDto?.state
        },
        create: {
          createDateTime: issueCredentialDto?.createDateTime,
          lastChangedBy: organisationId,
          createdBy: organisationId,
          connectionId: issueCredentialDto?.connectionId,
          state: issueCredentialDto?.state,
          threadId: issueCredentialDto?.threadId,
          schemaId,
          credDefId,
          credentialExchangeId: issueCredentialDto?.id,
          orgId: organisationId
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
  async saveAgentConnectionInvitations(
    connectionInvitation: string,
    agentId: string,
    orgId: string
  ): Promise<agent_invitations> {
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
  async getOrganization(orgId: string): Promise<organisation> {
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

  async saveFileUploadDetails(fileUploadPayload, userId: string): Promise<file_upload> {
    try {
      const { name, status, upload_type, orgId } = fileUploadPayload;
      return this.prisma.file_upload.create({
        data: {
          name: String(name),
          orgId: String(orgId),
          status,
          upload_type,
          createdBy: userId,
          lastChangedBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`[saveFileUploadDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateFileUploadDetails(fileId: string, fileUploadPayload): Promise<file_upload> {
    try {
      const { status } = fileUploadPayload;
      return this.prisma.file_upload.update({
        where: {
          id: fileId
        },
        data: {
          status
        }
      });
    } catch (error) {
      this.logger.error(`[updateFileUploadDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async countErrorsForFile(fileUploadId: string): Promise<number> {
    try {
      const errorCount = await this.prisma.file_data.count({
        where: {
          fileUploadId,
          isError: true
        }
      });

      return errorCount;
    } catch (error) {
      this.logger.error(`[countErrorsForFile] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
  async getAllFileDetails(
    orgId: string,
    getAllfileDetails: PreviewRequest
  ): Promise<{
    fileCount: number;
    fileList: {
      id: string;
      name: string;
      status: string;
      upload_type: string;
      orgId: string;
      createDateTime: Date;
      createdBy: string;
      lastChangedDateTime: Date;
      lastChangedBy: string;
      deletedAt: Date;
      failedRecords: number;
      totalRecords: number;
    }[];
  }> {
    try {
      const fileList = await this.prisma.file_upload.findMany({
        where: {
          orgId: String(orgId),
          OR: [
            { name: { contains: getAllfileDetails?.search, mode: 'insensitive' } },
            { status: { contains: getAllfileDetails?.search, mode: 'insensitive' } },
            { upload_type: { contains: getAllfileDetails?.search, mode: 'insensitive' } }
          ]
        },
        take: Number(getAllfileDetails?.pageSize),
        skip: (getAllfileDetails?.pageNumber - 1) * getAllfileDetails?.pageSize,
        orderBy: {
          createDateTime: 'desc'
        }
      });

      const fileListWithDetails = await Promise.all(
        fileList.map(async (file) => {
          const failedRecords = await this.countErrorsForFile(file.id);
          const totalRecords = await this.prisma.file_data.count({
            where: {
              fileUploadId: file.id
            }
          });
          const successfulRecords = totalRecords - failedRecords;
          return { ...file, failedRecords, totalRecords, successfulRecords };
        })
      );

      const fileCount = await this.prisma.file_upload.count({
        where: {
          orgId: String(orgId)
        }
      });

      return { fileCount, fileList: fileListWithDetails };
    } catch (error) {
      this.logger.error(`[getFileUploadDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getFileDetailsByFileId(
    fileId: unknown,
    getAllfileDetails: PreviewRequest
  ): Promise<{
    fileCount: number;
    fileDataList: {
      id: string;
      referenceId: string;
      isError: boolean;
      error: string;
      detailError: string;
      createDateTime: Date;
      createdBy: string;
      lastChangedDateTime: Date;
      lastChangedBy: string;
      deletedAt: Date;
      fileUploadId: string;
    }[];
  }> {
    try {
      const fileDataList = await this.prisma.file_data.findMany({
        where: {
          fileUploadId: fileId,
          OR: [
            { error: { contains: getAllfileDetails?.search, mode: 'insensitive' } },
            { referenceId: { contains: getAllfileDetails?.search, mode: 'insensitive' } },
            { detailError: { contains: getAllfileDetails?.search, mode: 'insensitive' } }
          ]
        },
        take: Number(getAllfileDetails?.pageSize),
        skip: (getAllfileDetails?.pageNumber - 1) * getAllfileDetails?.pageSize,
        orderBy: {
          createDateTime: 'desc'
        }
      });
      const fileCount = await this.prisma.file_data.count({
        where: {
          fileUploadId: fileId
        }
      });
      return { fileCount, fileDataList };
    } catch (error) {
      this.logger.error(`[getFileDetailsByFileId] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateFileUploadData(fileUploadData: FileUploadData): Promise<file_data> {
    try {
      const { jobId, fileUpload, isError, referenceId, error, detailError } = fileUploadData;
      if (jobId) {
        return this.prisma.file_data.update({
          where: { id: jobId },
          data: {
            detailError,
            error,
            isError,
            referenceId,
            fileUploadId: fileUpload
          }
        });
      } else {
        throw error;
      }
    } catch (error) {
      this.logger.error(`[saveFileUploadData] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
  async deleteFileDataByJobId(jobId: string): Promise<file_data> {
    try {
      if (jobId) {
        return this.prisma.file_data.update({
          where: { id: jobId },
          data: {
            credential_data: null
          }
        });
      }
    } catch (error) {
      this.logger.error(`[saveFileUploadData] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
  async saveFileDetails(fileData, userId: string) {
    try {
      const { credential_data, schemaId, credDefId, status, isError, fileUploadId } = fileData;
      return this.prisma.file_data.create({
        data: {
          credential_data,
          schemaId,
          credDefId,
          status,
          fileUploadId,
          isError,
          createdBy: userId,
          lastChangedBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`[saveFileUploadData] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getOrgAgentType(orgAgentId: string): Promise<string> {
    try {
      const { agent } = await this.prisma.org_agents_type.findFirst({
        where: {
          id: orgAgentId
        }
      });

      return agent;
    } catch (error) {
      this.logger.error(`[getOrgAgentType] - error: ${JSON.stringify(error)}`);
    }
  }

  async getFileDetails(fileId: string): Promise<file_data[]> {
    try {
      return this.prisma.file_data.findMany({
        where: {
          fileUploadId: fileId
        }
      });
    } catch (error) {
      this.logger.error(`[getFileDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getFailedCredentials(fileId: string): Promise<file_data[]> {
    try {
      return this.prisma.file_data.findMany({
        where: {
          fileUploadId: fileId,
          isError: true
        }
      });
    } catch (error) {
      this.logger.error(`[getFileDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateFileUploadStatus(fileId: string): Promise<file_upload> {
    try {
      return this.prisma.file_upload.update({
        where: {
          id: fileId
        },
        data: {
          status: FileUploadStatus.retry
        }
      });
    } catch (error) {
      this.logger.error(`[updateFileUploadStatus] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getFileDetailsById(fileId: string): Promise<file_upload> {
    try {
      return this.prisma.file_upload.findUnique({
        where: {
          id: fileId
        }
      });
    } catch (error) {
      this.logger.error(`[updateFileUploadStatus] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
