import { ResponseMessages } from '@credebl/common/response-messages';
import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { org_agents, organisation, platform_config, presentations } from '@prisma/client';
import { IProofPresentation } from '../interfaces/verification.interface';
import { IProofRequestSearchCriteria } from '../interfaces/verification.interface';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IProofPresentationsListCount } from '@credebl/common/interfaces/verification.interface';
import { SortValue } from '@credebl/enum/enum';

@Injectable()
export class VerificationRepository {
  constructor(
    private readonly prisma: PrismaService,
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
            { connectionId: { contains: proofRequestsSearchCriteria.searchByText, mode: 'insensitive' } },
            { state: { contains: proofRequestsSearchCriteria.searchByText, mode: 'insensitive' } },
            { presentationId: { contains: proofRequestsSearchCriteria.searchByText, mode: 'insensitive' } }
        ]
        },
        select: {
          createDateTime: true,
          createdBy: true,
          orgId: true,
          state: true,
          connectionId: true,
          id: true,
          presentationId: true
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
            { connectionId: { contains: proofRequestsSearchCriteria.searchByText, mode: 'insensitive' } },
            { state: { contains: proofRequestsSearchCriteria.searchByText, mode: 'insensitive' } },
            { presentationId: { contains: proofRequestsSearchCriteria.searchByText, mode: 'insensitive' } }
          ]
        }
      });

      return { proofRequestsCount, proofRequestsList };
    } catch (error) {
      this.logger.error(`[getAllProofRequests] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async storeProofPresentation(payload: IProofPresentation): Promise<presentations> {
    try {
      let organisationId: string;
      const { proofPresentationPayload, orgId } = payload;

      if (proofPresentationPayload?.contextCorrelationId) {
        const getOrganizationId = await this.getOrganizationByTenantId(proofPresentationPayload?.contextCorrelationId);
        organisationId = getOrganizationId?.orgId;
      } else {
        organisationId = orgId;
      }

      const proofPresentationsDetails = await this.prisma.presentations.upsert({
        where: {
          threadId: proofPresentationPayload?.threadId
        },
        update: {
          state: proofPresentationPayload.state,
          threadId: proofPresentationPayload.threadId,
          isVerified: proofPresentationPayload.isVerified,
          lastChangedBy: organisationId
        },
        create: {
          connectionId: proofPresentationPayload.connectionId,
          createdBy: organisationId,
          lastChangedBy: organisationId,
          state: proofPresentationPayload.state,
          threadId: proofPresentationPayload.threadId,
          isVerified: proofPresentationPayload.isVerified,
          presentationId: proofPresentationPayload.id,
          orgId: organisationId
        }
      });
      return proofPresentationsDetails;
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
}
