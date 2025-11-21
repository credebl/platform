/* eslint-disable camelcase */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// eslint-disable-next-line camelcase
import { Prisma, credential_templates, oidc_issuer, org_agents } from '@prisma/client';
import { PrismaService } from '@credebl/prisma-service';
import { IssuerMetadata, IssuerUpdation, OrgAgent } from '../interfaces/oid4vc-issuance.interfaces';
import { ResponseMessages } from '@credebl/common/response-messages';
import { x5cKeyType, x5cRecordStatus } from '@credebl/enum/enum';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';

@Injectable()
export class Oid4vcIssuanceRepository {
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

  async storeOidcCredentialDetails(credentialPayload, orgId: string): Promise<object> {
    try {
      const payload = credentialPayload.oidcIssueCredentialDto;
      const {
        credentialOfferId,
        state,
        id: issuanceSessionId,
        contextCorrelationId,
        credentialOfferPayload,
        issuedCredentials,
        issuerId
      } = payload;

      const credentialDetails = await this.prisma.oid4vc_credentials.upsert({
        where: {
          issuanceSessionId
        },
        update: {
          lastChangedBy: orgId,
          state,
          credentialConfigurationIds: credentialOfferPayload.credential_configuration_ids ?? [],
          ...(issuedCredentials !== undefined ? { issuedCredentials } : {})
        },
        create: {
          lastChangedBy: orgId,
          createdBy: orgId,
          state,
          orgId,
          credentialOfferId,
          contextCorrelationId,
          issuanceSessionId,
          publicIssuerId: issuerId,
          credentialConfigurationIds: credentialOfferPayload.credential_configuration_ids ?? [],
          ...(issuedCredentials !== undefined ? { issuedCredentials } : {})
        }
      });

      return credentialDetails;
    } catch (error) {
      this.logger.error(`Error in storeOidcCredentialDetails in issuance repository: ${error.message} `);
      throw error;
    }
  }

  async getOidcIssuerByOrg(orgId: string): Promise<oidc_issuer[]> {
    try {
      return await this.prisma.oidc_issuer.findMany({
        where: { createdBy: orgId },
        include: {
          templates: true
        },
        orderBy: {
          createDateTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error(`Error in getOidcIssuerByOrg: ${error.message}`);
      throw error;
    }
  }

  async getAllOidcIssuersByOrg(orgId: string): Promise<oidc_issuer[]> {
    try {
      return await this.prisma.oidc_issuer.findMany({
        where: {
          orgAgent: {
            orgId
          }
        },
        // include: {
        //   templates: true
        // },
        orderBy: {
          createDateTime: 'desc'
        }
      });
    } catch (error) {
      this.logger.error(`Error in getOidcIssuerByOrg: ${error.message}`);
      throw error;
    }
  }

  async getOidcIssuerDetailsById(issuerId: string): Promise<oidc_issuer> {
    try {
      return await this.prisma.oidc_issuer.findFirstOrThrow({
        where: { id: issuerId }
      });
    } catch (error) {
      this.logger.error(`Error in getOidcIssuerDetailsById: ${error.message}`);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addOidcIssuerDetails(issuerMetadata: IssuerMetadata, issuerProfileJson): Promise<oidc_issuer> {
    try {
      const { publicIssuerId, createdById, orgAgentId, batchCredentialIssuanceSize, authorizationServerUrl } =
        issuerMetadata;
      const oidcIssuerDetails = await this.prisma.oidc_issuer.create({
        data: {
          metadata: issuerProfileJson,
          publicIssuerId,
          createdBy: createdById,
          orgAgentId,
          batchCredentialIssuanceSize,
          authorizationServerUrl
        }
      });

      return oidcIssuerDetails;
    } catch (error) {
      this.logger.error(`[addOidcIssuerDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async updateOidcIssuerDetails(createdById: string, issuerConfig: IssuerUpdation): Promise<oidc_issuer> {
    try {
      const { issuerId, display, batchCredentialIssuanceSize } = issuerConfig;
      const oidcIssuerDetails = await this.prisma.oidc_issuer.update({
        where: { id: issuerId },
        data: {
          metadata: display as unknown as Prisma.InputJsonValue,
          createdBy: createdById,
          ...(batchCredentialIssuanceSize !== undefined ? { batchCredentialIssuanceSize } : {})
        }
      });

      return oidcIssuerDetails;
    } catch (error) {
      this.logger.error(`[addOidcIssuerDetails] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async deleteOidcIssuer(issuerId: string): Promise<oidc_issuer> {
    try {
      return await this.prisma.oidc_issuer.delete({
        where: { id: issuerId }
      });
    } catch (error) {
      this.logger.error(`[deleteOidcIssuer] - error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async createTemplate(
    issuerId: string,
    data: Omit<credential_templates, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<credential_templates> {
    try {
      return await this.prisma.credential_templates.create({
        data: {
          ...data,
          issuerId
        }
      });
    } catch (error) {
      this.logger.error(`Error in createTemplate: ${error.message}`);
      throw error;
    }
  }

  async getTemplateById(templateId: string): Promise<credential_templates | null> {
    try {
      return await this.prisma.credential_templates.findUnique({
        where: { id: templateId }
      });
    } catch (error) {
      this.logger.error(`Error in getTemplateById: ${error.message}`);
      throw error;
    }
  }

  async getTemplateByIds(templateIds: string[], issuerId: string): Promise<credential_templates[]> {
    try {
      // Early return if empty input (avoids full table scan if someone passes [])
      if (!Array.isArray(templateIds) || 0 === templateIds.length) {
        return [];
      }

      this.logger.debug(`getTemplateByIds templateIds=${JSON.stringify(templateIds)} issuerId=${issuerId}`);

      return await this.prisma.credential_templates.findMany({
        where: {
          id: { in: templateIds },
          issuerId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getTemplateByIds: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async getTemplateByNameForIssuer(name: string, issuerId: string): Promise<credential_templates[] | null> {
    try {
      return await this.prisma.credential_templates.findMany({
        where: {
          issuerId,
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error in getTemplateByNameForIssuer: ${error.message}`);
      throw error;
    }
  }

  async getTemplatesByIssuerId(issuerId: string): Promise<credential_templates[]> {
    try {
      return await this.prisma.credential_templates.findMany({
        where: { issuerId },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      this.logger.error(`Error in getTemplatesByIssuer: ${error.message}`);
      throw error;
    }
  }

  async getIssuerDetailsByIssuerId(issuerId: string): Promise<oidc_issuer | null> {
    try {
      return await this.prisma.oidc_issuer.findUnique({
        where: { id: issuerId }
      });
    } catch (error) {
      this.logger.error(`Error in getIssuerDetailsByIssuerId: ${error.message}`);
      throw error;
    }
  }

  async updateTemplate(templateId: string, data: Partial<credential_templates>): Promise<credential_templates> {
    try {
      return await this.prisma.credential_templates.update({
        where: { id: templateId },
        data
      });
    } catch (error) {
      this.logger.error(`Error in updateTemplate: ${error.message}`);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<credential_templates> {
    try {
      return await this.prisma.credential_templates.delete({
        where: { id: templateId }
      });
    } catch (error) {
      this.logger.error(`Error in deleteTemplate: ${error.message}`);
      throw error;
    }
  }
}
