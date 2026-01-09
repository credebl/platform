/* eslint-disable camelcase */
import { Injectable, Logger } from '@nestjs/common';
import { Invitation, InviteType } from '@credebl/enum/enum';
// eslint-disable-next-line camelcase
import { ecosystem, ecosystem_invitations, user } from '@prisma/client';

import { PrismaService } from '@credebl/prisma-service';

@Injectable()
export class EcosystemRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   *
   * @body sendInvitationDto
   * @returns orgInvitaionDetails
   */

  async createEcosystemInvitation(
    email: string,
    userId: string,
    type?: InviteType,
    status?: Invitation
  ): Promise<ecosystem_invitations> {
    return this.prisma.ecosystem_invitations.create({
      data: {
        email,
        // FIXME: Change status to PENDING once invitation accept/reject implemented
        status: status || Invitation.ACCEPTED,
        createdBy: userId,
        lastChangedBy: userId,
        type: type || InviteType.ECOSYSTEM,
        user: {
          connect: { id: userId }
        }
      }
    });
  }

  async getInvitationsByUserId(userId: string): Promise<ecosystem_invitations[]> {
    return this.prisma.ecosystem_invitations.findMany({
      where: {
        createdBy: userId
      },
      orderBy: {
        createDateTime: 'desc'
      }
    });
  }

  async getUserById(userId: string): Promise<user> {
    try {
      return this.prisma.user.findUnique({
        where: {
          id: userId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getUserById: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemInvitationsByEmail(email: string): Promise<ecosystem_invitations> {
    try {
      return this.prisma.ecosystem_invitations.findUnique({
        where: {
          email
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemInvitationsByEmail: ${error.message}`);
      throw error;
    }
  }

  async updateEcosystemInvitationStatusByEmail(email: string, status: Invitation): Promise<ecosystem_invitations> {
    try {
      return this.prisma.ecosystem_invitations.update({
        where: {
          email
        },
        data: {
          status
        }
      });
    } catch (error) {
      this.logger.error(`Error in updateEcosystemInvitationStatusByEmail: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemOrgDetailsByUserId(
    userId: string,
    ecosystemId: string
  ): Promise<{ ecosystemRole: { name: string } }[]> {
    try {
      return this.prisma.ecosystem_orgs.findMany({
        where: {
          createdBy: userId,
          ecosystemId
        },
        select: {
          ecosystemRole: {
            select: {
              name: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByOrgId: ${error.message}`);
      throw error;
    }
  }

  async getEcosystemDetailsByUserId(userId: string): Promise<ecosystem> {
    try {
      return this.prisma.ecosystem.findFirst({
        where: {
          createdBy: userId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByOrgId: ${error.message}`);
    }
  }

  async getUserByKeycloakId(keycloakId: string): Promise<user> {
    try {
      return this.prisma.user.findFirst({
        where: {
          keycloakUserId: keycloakId
        }
      });
    } catch (error) {
      this.logger.error(`Error in getEcosystemDetailsByOrgId: ${error.message}`);
    }
  }

  // /**
  //  * Description: create ecosystem
  //  * @param createEcosystemDto
  //  * @returns ecosystem
  //  */
  // // eslint-disable-next-line camelcase
  // async createNewEcosystem(createEcosystemDto: ICreateEcosystem, ecosystemLedgers: string[]): Promise<ecosystem> {
  //   try {
  //     const transaction = await this.prisma.$transaction(async (prisma) => {
  //       const { name, description, userId, logo, tags, orgId, autoEndorsement } = createEcosystemDto;
  //       const createdEcosystem = await prisma.ecosystem.create({
  //         data: {
  //           name,
  //           description,
  //           tags,
  //           autoEndorsement,
  //           logoUrl: logo,
  //           createdBy: userId,
  //           lastChangedBy: userId,
  //           ledgers: ecosystemLedgers
  //         }
  //       });
  //       let ecosystemUser;
  //       if (createdEcosystem) {
  //         ecosystemUser = await prisma.ecosystem_users.create({
  //           data: {
  //             userId: String(userId),
  //             ecosystemId: createdEcosystem.id,
  //             createdBy: userId,
  //             lastChangedBy: userId
  //           }
  //         });
  //       }

  //       if (ecosystemUser) {
  //         const ecosystemRoleDetails = await this.prisma.ecosystem_roles.findFirst({
  //           where: {
  //             name: EcosystemRoles.ECOSYSTEM_LEAD
  //           }
  //         });
  //         ecosystemUser = await prisma.ecosystem_orgs.create({
  //           data: {
  //             orgId: String(orgId),
  //             status: EcosystemOrgStatus.ACTIVE,
  //             ecosystemId: createdEcosystem.id,
  //             ecosystemRoleId: ecosystemRoleDetails.id,
  //             createdBy: userId,
  //             lastChangedBy: userId
  //           }
  //         });
  //       }
  //       return createdEcosystem;
  //     });

  //     // To return selective object data
  //     delete transaction.lastChangedDateTime;
  //     delete transaction.lastChangedBy;
  //     delete transaction.deletedAt;

  //     return transaction;
  //   } catch (error) {
  //     this.logger.error(`Error in create ecosystem transaction: ${error.message}`);
  //     throw error;
  //   }
  // }
  // async checkEcosystemNameExist(name: string): Promise<ecosystem> {
  //   try {
  //     const checkEcosystemExists = await this.prisma.ecosystem.findFirst({
  //       where: {
  //         name
  //       }
  //     });
  //     return checkEcosystemExists;
  //   } catch (error) {
  //     this.logger.error(`error: ${JSON.stringify(error)}`);
  //     throw new InternalServerErrorException(error);
  //   }
  // }
  // // eslint-disable-next-line camelcase
  // async getSpecificEcosystemConfig(key: string): Promise<ecosystem_config> {
  //   try {
  //     return await this.prisma.ecosystem_config.findFirstOrThrow({
  //       where: {
  //         key
  //       }
  //     });
  //   } catch (error) {
  //     this.logger.error(`error: ${JSON.stringify(error)}`);
  //     throw error;
  //   }
  // }
  // /**
  //  *
  //  * @param orgId
  //  * @returns Get specific organization details from ecosystem
  //  */
  // // eslint-disable-next-line camelcase
  // async checkEcosystemOrgs(orgId: string): Promise<ecosystem_orgs[]> {
  //   try {
  //     if (!orgId) {
  //       throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
  //     }
  //     return this.prisma.ecosystem_orgs.findMany({
  //       where: {
  //         orgId
  //       },
  //       include: {
  //         ecosystemRole: true
  //       }
  //     });
  //   } catch (error) {
  //     this.logger.error(`error: ${JSON.stringify(error)}`);
  //     throw error;
  //   }
  // }
}
