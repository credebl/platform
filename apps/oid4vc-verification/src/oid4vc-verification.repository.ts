/* eslint-disable camelcase */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { oid4vp_verifier, org_agents } from '@prisma/client';
import { PrismaService } from '@credebl/prisma-service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrgAgent } from '../interfaces/oid4vp-verifier.interfaces';

@Injectable()
export class Oid4vpRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

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

  async createOid4vpVerifier(verifierDetails, orgId: string, userId: string): Promise<object> {
    try {
      const { id, clientMetadata, verifierId } = verifierDetails;
      return this.prisma.oid4vp_verifier.create({
        data: {
          metadata: clientMetadata,
          publicVerifierId: verifierId,
          verifierId: id,
          createdBy: userId,
          lastChangedBy: userId,
          orgAgentId: orgId
        }
      });
    } catch (error) {
      this.logger.error(`Error in createOid4vpVerifier: ${error.message}`);
      throw error;
    }
  }

  async updateOid4vpVerifier(verifierDetails, userId: string, verifierId: string): Promise<object> {
    try {
      const { clientMetadata } = verifierDetails;
      return this.prisma.oid4vp_verifier.update({
        data: {
          metadata: clientMetadata,
          lastChangedBy: userId
        },
        where: {
          id: verifierId
        }
      });
    } catch (error) {
      this.logger.error(`Error in createOid4vpVerifier: ${error.message}`);
      throw error;
    }
  }

  async getVerifiersByPublicVerifierId(publicVerifierId: string): Promise<oid4vp_verifier[] | null> {
    try {
      return await this.prisma.oid4vp_verifier.findMany({
        where: {
          publicVerifierId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getVerifiersByPublicVerifierId: ${error.message}`);
      throw error;
    }
  }

  async getVerifiersByVerifierId(verifierId: string): Promise<oid4vp_verifier[] | null> {
    try {
      return await this.prisma.oid4vp_verifier.findMany({
        where: {
          id: verifierId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getVerifiersByPublicVerifierId: ${error.message}`);
      throw error;
    }
  }
}
