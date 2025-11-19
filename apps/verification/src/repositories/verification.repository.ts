import { ResponseMessages } from '@credebl/common/response-messages';
import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { agent_invitations, org_agents, organisation, platform_config } from '@prisma/client';
import { IProofPresentation, IProofRequestSearchCriteria } from '../interfaces/verification.interface';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IProofPresentationsListCount, IVerificationRecords } from '@credebl/common/interfaces/verification.interface';
import { SortValue } from '@credebl/enum/enum';
import { CommonService } from '@credebl/common';

@Injectable()
export class VerificationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commonService: CommonService,
    private readonly logger: Logger
  ) {}

  /**
   * Get org agent details
   * @param orgId
   * @returns
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
        throw new NotFoundException(ResponseMessages.verification.error.notFound);
      }

      return agentDetails;
    } catch (error) {
      this.logger.error(`[getProofPresentations] - error in get agent endpoint : ${error.message} `);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
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

  async getAllProofRequests(
    user: IUserRequest,
    orgId: string,
    proofRequestsSearchCriteria: IProofRequestSearchCriteria
  ): Promise<IProofPresentationsListCount> {
    try {

      const proofRequestsList = await this.prisma.presentations.findMany({
        where: {
          orgId,
          OR: [
            { connectionId: { contains: proofRequestsSearchCriteria.search, mode: 'insensitive' } },
            { state: { contains: proofRequestsSearchCriteria.search, mode: 'insensitive' } },
            { presentationId: { contains: proofRequestsSearchCriteria.search, mode: 'insensitive' } }
          ]
        },
        select: {
          createDateTime: true,
          createdBy: true,
          orgId: true,
          state: true,
          connectionId: true,
          id: true,
          presentationId: true,
          schemaId: true,
          emailId: true
        },
        orderBy: {
          [proofRequestsSearchCriteria.sortField]: SortValue.ASC === proofRequestsSearchCriteria.sortBy ? 'asc' : 'desc'
        },

        take: Number(proofRequestsSearchCriteria.pageSize),
        skip: (proofRequestsSearchCriteria.pageNumber - 1) * proofRequestsSearchCriteria.pageSize
      });
      const proofRequestsCount = await this.prisma.presentations.count({
        where: {
          orgId,
          OR: [
            { connectionId: { contains: proofRequestsSearchCriteria.search, mode: 'insensitive' } },
            { state: { contains: proofRequestsSearchCriteria.search, mode: 'insensitive' } },
            { presentationId: { contains: proofRequestsSearchCriteria.search, mode: 'insensitive' } }
          ]
        }
      });

      return { proofRequestsCount, proofRequestsList };
    } catch (error) {
      this.logger.error(`[getAllProofRequests] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getVerificationRecordsCount(orgId: string): Promise<number> {
    try {
      const verificationRecordsCount = await this.prisma.presentations.count({
        where: {
          orgId
        }
      });
      return verificationRecordsCount;
    } catch (error) {
      this.logger.error(`[get verification records by org Id] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
  async storeProofPresentation(payload: IProofPresentation): Promise<org_agents> {
    try {
      let encryptEmailId;
      let organisationId: string;
      // eslint-disable-next-line camelcase
      let agentOrg: org_agents;
      let schemaId;

      const { proofPresentationPayload, orgId } = payload;

      //For Educreds
      if (proofPresentationPayload?.['proofData']?.presentation?.presentationExchange?.verifiableCredential) {

        const emailId = proofPresentationPayload?.['proofData']?.presentation?.presentationExchange?.verifiableCredential[0].credentialSubject?.email; 
        encryptEmailId = await this.commonService.dataEncryption(emailId);
      } else {
        encryptEmailId = 'Not Available';
      }
     
      //For Educreds 
      if (proofPresentationPayload?.['proofData']?.request?.presentationExchange) {
        schemaId = proofPresentationPayload?.['proofData']?.request?.presentationExchange?.presentation_definition?.input_descriptors[0].schema[0].uri;
      }

      if ('default' !== proofPresentationPayload?.contextCorrelationId) {
        agentOrg = await this.getOrganizationByTenantId(proofPresentationPayload?.contextCorrelationId);
        organisationId = agentOrg?.orgId;
        if (agentOrg?.orgId) {
          organisationId = agentOrg?.orgId;
        } else {
          agentOrg = await this.getOrganizationByOrgId(orgId);
          organisationId = orgId;
        }
      } else {
        agentOrg = await this.getOrganizationByOrgId(orgId);
        organisationId = orgId;
      }
      await this.prisma.presentations.upsert({
        where: {
          threadId: proofPresentationPayload?.threadId
        },
        update: {
          state: proofPresentationPayload.state,
          threadId: proofPresentationPayload.threadId,
          isVerified: proofPresentationPayload.isVerified,
          lastChangedBy: organisationId,
          connectionId: proofPresentationPayload.connectionId,
          emailId: encryptEmailId
        },
        create: {
          connectionId: proofPresentationPayload.connectionId,
          createdBy: organisationId,
          lastChangedBy: organisationId,
          state: proofPresentationPayload.state,
          threadId: proofPresentationPayload.threadId,
          isVerified: proofPresentationPayload.isVerified,
          presentationId: proofPresentationPayload.id,
          orgId: organisationId,
          schemaId,
          emailId: encryptEmailId
        }
      });
      return agentOrg;
    } catch (error) {
      this.logger.error(`Error in get saveProofPresentationDetails: ${error.message} `);
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
      throw error;
    }
  }

  /**
   * Get organization details
   * @returns
   */
  async getOrganization(orgId: string): Promise<organisation> {
    try {
      return this.prisma.organisation.findFirst({ where: { id: orgId } });
    } catch (error) {
      this.logger.error(`[getOrganization] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // eslint-disable-next-line camelcase
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

  // eslint-disable-next-line camelcase
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
          createDateTime: 'asc' // or 'desc' for descending order
        }
      });
    } catch (error) {
      this.logger.error(`Error in getInvitationDid in verification repository: ${error.message}`);
      throw error;
    }
  }


  async deleteVerificationRecordsByOrgId(orgId: string): Promise<IVerificationRecords> {
    try {
      return await this.prisma.$transaction(async (prisma) => {  

        const recordsToDelete = await this.prisma.presentations.findMany({
          where: { orgId }
        });

        const deleteResult = await prisma.presentations.deleteMany({
          where: { orgId }
        });
        
        return { deleteResult, recordsToDelete};
      });
    } catch (error) {
      this.logger.error(`Error in deleting verification records: ${error.message}`);    
      throw error;
    }
  } 
  
}
