/* eslint-disable camelcase */
// src/repositories/x509-certificate.repository.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
import {
  CertificateDateCheckDto,
  CreateX509CertificateEntity,
  IX509CollisionResult,
  IX509ListCount,
  OrgAgent,
  UpdateCertificateStatusDto
} from '../interfaces/x509.interface';
import { x5cRecordStatus } from '@credebl/enum/enum';
import { ResponseMessages } from '@credebl/common/response-messages';
import { org_agents } from '@prisma/client';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';

@Injectable()
export class X509CertificateRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  // Helper method to get orgAgent by orgId
  private async getOrgAgentByOrgId(orgId: string): Promise<org_agents> {
    try {
      const orgAgent = await this.prisma.org_agents.findFirst({
        where: {
          orgId
        }
      });

      if (!orgAgent) {
        throw new NotFoundException(`OrgAgent with orgId ${orgId} not found`);
      }

      return orgAgent;
    } catch (error) {
      this.logger.error(`Error in getOrgAgentByOrgId: ${error.message}`);
      throw error;
    }
  }

  // CREATE - Create new certificate using orgId
  async create(createDto: CreateX509CertificateEntity): Promise<X509CertificateRecord> {
    try {
      // Get orgAgent by orgId
      const orgAgent = await this.getOrgAgentByOrgId(createDto.orgId);

      const certificate = await this.prisma.x509_certificates.create({
        data: {
          orgAgentId: orgAgent.id,
          keyType: createDto.keyType,
          status: createDto.status,
          validFrom: createDto.validFrom,
          expiry: createDto.expiry,
          certificateBase64: createDto.certificateBase64,
          createdBy: createDto.createdBy,
          lastChangedBy: createDto.lastChangedBy
        }
      });

      return certificate;
    } catch (error) {
      this.logger.error(`Error in create certificate: ${error.message}`);
      throw error;
    }
  }

  // READ - Find all certificates with optional filtering and pagination
  async findAll(options?: {
    orgId: string;
    status?: string;
    keyType?: string;
    page?: number;
    limit?: number;
  }): Promise<IX509ListCount> {
    try {
      const { orgId, status, keyType, page = 1, limit = 10 } = options || {};

      const skip = (page - 1) * limit;

      const where: Parameters<typeof this.prisma.x509_certificates.findMany>[0]['where'] = {};

      // Build where conditions with joins
      if (orgId || status || keyType) {
        where.AND = [];

        where.AND.push({
          org_agents: {
            orgId
          }
        });

        if (status) {
          where.AND.push({ status });
        }

        if (keyType) {
          where.AND.push({ keyType });
        }
      }

      const [data, total] = await Promise.all([
        this.prisma.x509_certificates.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        this.prisma.x509_certificates.count({ where })
      ]);

      return { data, total };
    } catch (error) {
      this.logger.error(`Error in findAll certificates: ${error.message}`);
      throw error;
    }
  }

  // READ - Find certificate by ID
  async findById(orgId: string, id: string): Promise<X509CertificateRecord> {
    try {
      const certificate = await this.prisma.x509_certificates.findUnique({
        where: {
          id,
          org_agents: {
            orgId
          }
        }
      });

      if (!certificate) {
        throw new NotFoundException(`Certificate with ID ${id} not found`);
      }

      return certificate;
    } catch (error) {
      this.logger.error(`Error in findById: ${error.message}`);
      throw error;
    }
  }

  // READ - Find certificates by organization ID
  async findByOrgId(orgId: string): Promise<X509CertificateRecord[]> {
    try {
      const certificates = await this.prisma.x509_certificates.findMany({
        where: {
          org_agents: {
            orgId
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return certificates;
    } catch (error) {
      this.logger.error(`Error in findByOrgId: ${error.message}`);
      throw error;
    }
  }

  // UTILITY - Check date collision without throwing exception
  async hasDateCollision(dateCheckDto: CertificateDateCheckDto): Promise<IX509CollisionResult> {
    try {
      const { orgId, validFrom, expiry, excludeCertificateId } = dateCheckDto;

      const collisions = await this.prisma.x509_certificates.findMany({
        where: {
          status: dateCheckDto.status,
          keyType: dateCheckDto.keyType,
          org_agents: {
            orgId
          },
          AND: [
            {
              OR: [
                {
                  AND: [{ validFrom: { lte: expiry } }, { expiry: { gte: validFrom } }]
                }
              ]
            },
            ...(excludeCertificateId ? [{ id: { not: excludeCertificateId } }] : [])
          ]
        }
      });

      return {
        hasCollision: 0 < collisions.length,
        collisions
      };
    } catch (error) {
      this.logger.error(`Error in hasDateCollision: ${error.message}`);
      throw error;
    }
  }

  // UPDATE - Update certificate status
  async updateStatus(id: string, statusDto: UpdateCertificateStatusDto): Promise<X509CertificateRecord> {
    try {
      const certificate = await this.prisma.x509_certificates.update({
        where: { id },
        data: {
          status: statusDto.status,
          lastChangedBy: statusDto.lastChangedBy
        }
      });

      return certificate;
    } catch (error) {
      this.logger.error(`Error in updateStatus: ${error.message}`);
      throw error;
    }
  }

  // // DELETE - Delete certificate
  // async delete(id: string) {
  //   try {
  //     await this.findById(id); // Check if certificate exists

  //     await this.prisma.x509_certificates.delete({
  //       where: { id }
  //     });
  //   } catch (error) {
  //     this.logger.error(`Error in delete certificate: ${error.message}`);
  //     throw error;
  //   }
  // }

  // UTILITY - Check if certificate exists
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.prisma.x509_certificates.count({
        where: { id }
      });
      return 0 < count;
    } catch (error) {
      this.logger.error(`Error in exists check: ${error.message}`);
      throw error;
    }
  }

  // UTILITY - Find expiring certificates for an org
  async findExpiringCertificatesByOrg(orgId: string, days: number = 30): Promise<X509CertificateRecord[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const certificates = await this.prisma.x509_certificates.findMany({
        where: {
          org_agents: {
            orgId
          },
          expiry: {
            lte: expiryDate
          },
          status: 'Active'
        },
        orderBy: {
          expiry: 'asc'
        }
      });

      return certificates;
    } catch (error) {
      this.logger.error(`Error in findExpiringCertificatesByOrg: ${error.message}`);
      throw error;
    }
  }

  async getCurrentActiveCertificate(orgId: string): Promise<X509CertificateRecord> {
    try {
      const now = new Date();

      const certificate = await this.prisma.x509_certificates.findFirst({
        where: {
          org_agents: {
            orgId
          },
          status: x5cRecordStatus.Active,
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
        throw new NotFoundException(ResponseMessages.x509.error.agentEndPointNotFound);
      }

      return agentDetails;
    } catch (error) {
      this.logger.error(`Error in get getAgentEndPoint: ${error.message} `);
      throw error;
    }
  }
}
