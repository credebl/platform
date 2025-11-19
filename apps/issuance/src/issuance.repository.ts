/* eslint-disable camelcase */
import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import {
  agent_invitations,
  file_data,
  file_upload,
  org_agents,
  organisation,
  platform_config,
  schema
} from '@prisma/client';
import { ResponseMessages } from '@credebl/common/response-messages';
import {
  FileUpload,
  FileUploadData,
  IDeletedFileUploadRecords,
  IssueCredentialWebhookPayload,
  OrgAgent,
  PreviewRequest,
  SchemaDetails
} from '../interfaces/issuance.interfaces';
import { FileUploadStatus } from 'apps/api-gateway/src/enum';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IIssuedCredentialSearchParams } from 'apps/api-gateway/src/issuance/interfaces';
import { PrismaTables, SortValue } from '@credebl/enum/enum';
import { IDeletedIssuanceRecords } from '@credebl/common/interfaces/issuance.interface';
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
  async getAgentEndPoint(orgId: string): Promise<OrgAgent> {
    try {
      const agentDetails = await this.prisma.org_agents.findFirst({
        where: {
          orgId
        },
        include: {
          organisation: true
        }
      });

      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
      throw error;
    }
  }

  async getIssuanceRecordsCount(orgId: string): Promise<number> {
    try {
      const issuanceRecordsCount = await this.prisma.credentials.count({
        where: {
          orgId
        }
      });
      return issuanceRecordsCount;
    } catch (error) {
      this.logger.error(`[get issuance records by org Id] - error: ${JSON.stringify(error)}`);
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

  async getOrganizationByOrgId(orgId: string): Promise<org_agents> {
    try {
      return this.prisma.org_agents.findFirst({
        where: {
          orgId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getOrganization in issuance repository: ${error.message} `);
      throw error;
    }
  }
  

  async getInvitationDidByOrgId(orgId: string): Promise<agent_invitations> {
    try {
      return this.prisma.agent_invitations.findFirst({
        where: {
          AND: [
            {
            orgId
            },
            {
              invitationDid: {
                not: null
              }
            }
          ]
        },
        orderBy: {
          createDateTime: 'asc'
        }
      });
    } catch (error) {
      this.logger.error(`Error in getInvitationDid in issuance repository: ${error.message}`);
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
            { schemaId: { contains: issuedCredentialsSearchCriteria.search, mode: 'insensitive' } },
            { connectionId: { contains: issuedCredentialsSearchCriteria.search, mode: 'insensitive' } }
          ]
        },
        select: {
          credentialExchangeId: true,
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
            { schemaId: { contains: issuedCredentialsSearchCriteria.search, mode: 'insensitive' } },
            { connectionId: { contains: issuedCredentialsSearchCriteria.search, mode: 'insensitive' } }
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
  async saveIssuedCredentialDetails(payload: IssueCredentialWebhookPayload): Promise<org_agents> {
    try {
      let organisationId: string;
      let agentOrg: org_agents;
      const { issueCredentialDto, id } = payload;
      if ('default' !== issueCredentialDto?.contextCorrelationId) {
        agentOrg = await this.getOrganizationByTenantId(issueCredentialDto?.contextCorrelationId);
        if (agentOrg?.orgId) {
          organisationId = agentOrg?.orgId;
        } else {
          agentOrg = await this.getOrganizationByOrgId(id);
          organisationId = id;
        }
      } else {
        agentOrg = await this.getOrganizationByOrgId(id);
        organisationId = id;
      }

      let schemaId = '';

        if (
          (issueCredentialDto?.metadata?.['_anoncreds/credential']?.schemaId ||
           issueCredentialDto?.['credentialData']?.offer?.jsonld?.credential?.['@context'][1]) ||
          (issueCredentialDto?.state &&
           issueCredentialDto?.['credentialData']?.proposal?.jsonld?.credential?.['@context'][1])
        ) {
        schemaId = issueCredentialDto?.metadata?.['_anoncreds/credential']?.schemaId || issueCredentialDto?.['credentialData']?.offer?.jsonld?.credential?.['@context'][1] || issueCredentialDto?.['credentialData']?.proposal?.jsonld?.credential?.['@context'][1];
      }

      let credDefId = '';
      if (issueCredentialDto?.metadata?.['_anoncreds/credential']?.credentialDefinitionId) {
        credDefId = issueCredentialDto?.metadata?.['_anoncreds/credential']?.credentialDefinitionId;
      }

      await this.prisma.credentials.upsert({
        where: {
          threadId: issueCredentialDto?.threadId
        },
        update: {
          lastChangedBy: organisationId,
          createDateTime: issueCredentialDto?.createDateTime,
          threadId: issueCredentialDto?.threadId,
          connectionId: issueCredentialDto?.connectionId,
          state: issueCredentialDto?.state,
          schemaId,
          credDefId
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

      return agentOrg;
    } catch (error) {
      this.logger.error(`Error in get saveIssuedCredentialDetails: ${error.message} `);
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

  async getSchemaDetails(schemaId: string): Promise<schema> {
    try {
      const schemaDetails = await this.prisma.schema.findFirstOrThrow({
        where: {
          schemaLedgerId: schemaId
        }
      });

      return schemaDetails;
    } catch (error) {
      this.logger.error(`Error in get schema details: ${error.message}`);
      throw new InternalServerErrorException(error.message);
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

      const schemaDetails = await this.getSchemaDetailsBySchemaIdentifier(credentialDefinitionDetails.schemaLedgerId);

      
      if (!schemaDetails) {
        throw new NotFoundException(`Schema not found for credential definition ID: ${credentialDefinitionId}`);
      }

      const credentialDefRes = {
        credentialDefinitionId: credentialDefinitionDetails.credentialDefinitionId,
        tag: credentialDefinitionDetails.tag,
        schemaLedgerId: schemaDetails.schemaLedgerId,
        attributes: schemaDetails.attributes,
        schemaName: schemaDetails.name
      };

      return credentialDefRes;
    } catch (error) {
      this.logger.error(`Error in getCredentialDefinitionDetails: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getSchemaDetailsBySchemaIdentifier(schemaIdentifier: string): Promise<schema> {
    const schemaDetails = await this.prisma.schema.findFirstOrThrow({
      where: {
        schemaLedgerId: schemaIdentifier
      }
    });
    return schemaDetails;
  }

  async saveFileUploadDetails(fileUploadPayload: FileUpload, userId: string): Promise<file_upload> {
    try {
      const { name, status, upload_type, orgId, credentialType, templateId } = fileUploadPayload;
      return this.prisma.file_upload.create({
        data: {
          name: String(name),
          orgId: String(orgId),
          status,
          upload_type,
          createdBy: userId,
          lastChangedBy: userId,
          credential_type: credentialType,
          templateId
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
          OR: [{ isError: true }, { status: false }]
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
      templateId: string;
    }[];
  }> {
    try {
      const fileList = await this.prisma.file_upload.findMany({
        where: {
          orgId,
          OR: [
            { name: { contains: getAllfileDetails?.searchByText, mode: 'insensitive' } },
            { status: { contains: getAllfileDetails?.searchByText, mode: 'insensitive' } },
            { upload_type: { contains: getAllfileDetails?.searchByText, mode: 'insensitive' } }
          ]
        },
        take: Number(getAllfileDetails?.pageSize),
        skip: (getAllfileDetails?.pageNumber - 1) * getAllfileDetails?.pageSize,
        orderBy: {
          createDateTime: 'desc' === getAllfileDetails.sortBy ? 'desc' : 'asc'
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
          orgId
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
            { error: { contains: getAllfileDetails?.searchByText, mode: 'insensitive' } },
            { referenceId: { contains: getAllfileDetails?.searchByText, mode: 'insensitive' } },
            { detailError: { contains: getAllfileDetails?.searchByText, mode: 'insensitive' } }
          ]
        },
        take: Number(getAllfileDetails?.pageSize),
        skip: (getAllfileDetails?.pageNumber - 1) * getAllfileDetails?.pageSize,
        orderBy: {
          createDateTime: 'desc' === getAllfileDetails.sortBy ? 'desc' : 'asc'
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
            credential_data: null,
            status: true
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
      const { credential_data, schemaId, credDefId, status, isError, fileUploadId, credentialType } = fileData;
      return this.prisma.file_data.create({
        data: {
          credential_data,
          schemaId,
          credDefId,
          status,
          fileUploadId,
          isError,
          createdBy: userId,
          lastChangedBy: userId,
          credential_type: credentialType
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
      throw error;
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
          OR: [{ isError: true }, { status: false }]
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

  async getFileUploadDataByOrgId(orgId: string): Promise<file_upload[]> {
    try {
      const fileDetails = await this.prisma.file_upload.findMany({
        where: {
          orgId
        }
      });
      return fileDetails;
    } catch (error) {
      this.logger.error(`[getting file upload details] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async deleteFileUploadData(fileUploadIds: string[], orgId: string): Promise<IDeletedFileUploadRecords> {
    try {
      return await this.prisma.$transaction(async (prisma) => {

        const deleteFileDetails = await prisma.file_data.deleteMany({
          where: {
            fileUploadId: {
              in: fileUploadIds
            }
          }
        });

        const deleteFileUploadDetails = await prisma.file_upload.deleteMany({
          where: {
            orgId
          }
        });

        return { deleteFileDetails, deleteFileUploadDetails };
    
      });
    } catch (error) {
      this.logger.error(`[Error in deleting file data] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async deleteIssuanceRecordsByOrgId(orgId: string): Promise<IDeletedIssuanceRecords> {
    try {
      const tablesToCheck = [`${PrismaTables.PRESENTATIONS}`];

      const referenceCounts = await Promise.all(
        tablesToCheck.map((table) => this.prisma[table].count({ where: { orgId } }))
      );

      const referencedTables = referenceCounts
        .map((count, index) => (0 < count ? tablesToCheck[index] : null))
        .filter(Boolean);

      if (0 < referencedTables.length) {
        let errorMessage = `Organization ID ${orgId} is referenced in the following table(s): ${referencedTables.join(', ')}`;

        if (1 === referencedTables.length) {
          if (referencedTables.includes(`${PrismaTables.PRESENTATIONS}`)) {
            errorMessage += `, ${ResponseMessages.verification.error.removeVerificationData}`;
          }
        }

        throw new ConflictException(errorMessage);
      }

      return await this.prisma.$transaction(async (prisma) => {
        
        const recordsToDelete = await this.prisma.credentials.findMany({
          where: { orgId },
          select: {
            createDateTime: true,
            createdBy: true,
            connectionId: true,
            schemaId: true,
            state: true,
            orgId: true
          }
        });

        const deleteResult = await prisma.credentials.deleteMany({
          where: { orgId }
        });

        return { deleteResult, recordsToDelete};
      });
    } catch (error) {
      this.logger.error(`Error in deleting issuance records: ${error.message}`);
      throw error;
    }
  }
}
