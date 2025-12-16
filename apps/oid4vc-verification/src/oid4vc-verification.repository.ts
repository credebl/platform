/* eslint-disable camelcase */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { oid4vp_verifier, org_agents } from '@prisma/client';
import { PrismaService } from '@credebl/prisma-service';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrgAgent } from '../interfaces/oid4vp-verifier.interfaces';
import { Oid4vpPresentationWh } from '../interfaces/oid4vp-verification-sessions.interfaces';
import { x5cKeyType, x5cRecordStatus } from '@credebl/enum/enum';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';

@Injectable()
export class Oid4vpRepository {
  private readonly logger = new Logger('Oid4vpRepository');
  constructor(private readonly prisma: PrismaService) {}

  async getAgentEndPoint(orgId: string): Promise<OrgAgent> {
    this.logger.debug(`[getAgentEndPoint] called with orgId=${orgId}`);
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
        this.logger.warn(`[getAgentEndPoint] No agent endpoint found for orgId=${orgId}`);
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }

      this.logger.debug(`[getAgentEndPoint] Found agent endpoint with id=${agentDetails.id}`);
      return agentDetails;
    } catch (error) {
      this.logger.error(`[getAgentEndPoint] Error in get getAgentEndPoint: ${error.message} `);
      throw error;
    }
  }

  async getOrganizationByTenantId(tenantId: string): Promise<org_agents> {
    this.logger.debug(`[getOrganizationByTenantId] called with tenantId=${tenantId}`);
    try {
      const record = await this.prisma.org_agents.findFirst({
        where: {
          tenantId
        }
      });
      this.logger.debug(`[getOrganizationByTenantId] Found orgAgent id=${record?.id ?? 'none'}`);
      return record;
    } catch (error) {
      this.logger.error(
        `[getOrganizationByTenantId] Error in getOrganization in issuance repository: ${error.message} `
      );
      throw error;
    }
  }

  async createOid4vpVerifier(verifierDetails, orgId: string, userId: string): Promise<object> {
    this.logger.debug(
      `[createOid4vpVerifier] called for orgId=${orgId}, userId=${userId}, verifierId=${verifierDetails?.verifierId}`
    );
    try {
      const { id, clientMetadata, verifierId } = verifierDetails;
      const created = await this.prisma.oid4vp_verifier.create({
        data: {
          metadata: clientMetadata,
          publicVerifierId: verifierId,
          verifierId: id,
          createdBy: userId,
          lastChangedBy: userId,
          orgAgentId: orgId
        }
      });
      this.logger.debug(`[createOid4vpVerifier] Created verifier record with id=${created.id}`);
      return created;
    } catch (error) {
      this.logger.error(`[createOid4vpVerifier] Error in createOid4vpVerifier: ${error?.message ?? error}`);
      throw error;
    }
  }

  async updateOid4vpVerifier(verifierDetails, userId: string, verifierId: string): Promise<object> {
    this.logger.debug(`[updateOid4vpVerifier] called with verifierId=${verifierId}, userId=${userId}`);
    try {
      const { clientMetadata } = verifierDetails;
      const updated = await this.prisma.oid4vp_verifier.update({
        data: {
          metadata: clientMetadata,
          lastChangedBy: userId
        },
        where: {
          id: verifierId
        }
      });
      this.logger.debug(`[updateOid4vpVerifier] Updated verifier id=${updated.id}`);
      return updated;
    } catch (error) {
      this.logger.error(`[updateOid4vpVerifier] Error in updateOid4vpVerifier: ${error.message}`);
      throw error;
    }
  }

  async getVerifiersByPublicVerifierId(publicVerifierId: string): Promise<oid4vp_verifier[] | null> {
    this.logger.debug(`[getVerifiersByPublicVerifierId] called with publicVerifierId=${publicVerifierId}`);
    try {
      const result = await this.prisma.oid4vp_verifier.findMany({
        where: {
          publicVerifierId
        }
      });
      this.logger.debug(`[getVerifiersByPublicVerifierId] Found ${result.length} records`);
      return result;
    } catch (error) {
      this.logger.error(`[getVerifiersByPublicVerifierId] Error in getVerifiersByPublicVerifierId: ${error.message}`);
      throw error;
    }
  }

  async getVerifiersByVerifierId(orgId: string, verifierId?: string): Promise<oid4vp_verifier[] | null> {
    this.logger.debug(`[getVerifiersByVerifierId] called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}`);
    try {
      const result = await this.prisma.oid4vp_verifier.findMany({
        where: {
          id: verifierId,
          orgAgent: {
            orgId
          }
        }
      });
      this.logger.debug(`[getVerifiersByVerifierId] Found ${result.length} records`);
      return result;
    } catch (error) {
      this.logger.error(`[getVerifiersByVerifierId] Error in getVerifiersByPublicVerifierId: ${error.message}`);
      throw error;
    }
  }

  async getVerifierById(orgId: string, verifierId?: string): Promise<oid4vp_verifier | null> {
    this.logger.debug(`[getVerifierById] called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}`);
    try {
      const result = await this.prisma.oid4vp_verifier.findUnique({
        where: {
          id: verifierId,
          orgAgent: {
            orgId
          }
        }
      });
      this.logger.debug(`[getVerifierById] Found record id=${result?.id ?? 'none'}`);
      return result;
    } catch (error) {
      this.logger.error(`[getVerifierById] Error in getVerifiersByPublicVerifierId: ${error.message}`);
      throw error;
    }
  }

  async deleteVerifierByVerifierId(orgId: string, verifierId?: string): Promise<oid4vp_verifier | null> {
    this.logger.debug(`[deleteVerifierByVerifierId] called with orgId=${orgId}, verifierId=${verifierId ?? 'N/A'}`);
    try {
      const deleted = await this.prisma.oid4vp_verifier.delete({
        where: {
          id: verifierId,
          orgAgent: {
            orgId
          }
        }
      });
      this.logger.debug(`[deleteVerifierByVerifierId] Deleted verifier id=${deleted?.id ?? 'none'}`);
      return deleted;
    } catch (error) {
      this.logger.error(`[deleteVerifierByVerifierId] Error in deleteVerifierByVerifierId: ${error.message}`);
      throw error;
    }
  }

  async storeOid4vpPresentationDetails(
    oid4vpPresentationPayload: Oid4vpPresentationWh,
    orgId: string
  ): Promise<object> {
    try {
      const {
        state,
        id: verificationSessionId,
        contextCorrelationId,
        authorizationRequestId,
        verifierId
      } = oid4vpPresentationPayload;
      const credentialDetails = await this.prisma.oid4vp_presentations.upsert({
        where: {
          verificationSessionId
        },
        update: {
          lastChangedBy: orgId,
          state
        },
        create: {
          lastChangedBy: orgId,
          createdBy: orgId,
          state,
          orgId,
          contextCorrelationId,
          verificationSessionId,
          presentationId: authorizationRequestId,
          publicVerifierId: verifierId
        }
      });

      return credentialDetails;
    } catch (error) {
      this.logger.error(`Error in storeOid4vpPresentationDetails in oid4vp-presentation repository: ${error.message} `);
      throw error;
    }
  }

  async getCurrentActiveCertificate(orgId: string, keyType: x5cKeyType): Promise<X509CertificateRecord> {
    try {
      const now = new Date();

      const certificate = await this.prisma.x509_certificates.findFirst({
        where: {
          org_agents: {
            orgId
          },
          status: x5cRecordStatus.Active,
          keyType,
          validFrom: {
            lte: now
          },
          expiry: {
            gte: now
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return certificate;
    } catch (error) {
      this.logger.error(`Error in getCurrentActiveCertificate: ${error.message}`);
      throw error;
    }
  }
}
