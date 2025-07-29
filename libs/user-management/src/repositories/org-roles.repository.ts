import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { PrismaService } from '@credebl/prisma-service/dist/src/prisma-service.service';
import { OrgRoles, IOrgRoles } from '@credebl/common';

@Injectable()
export class OrgRolesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  // eslint-disable-next-line camelcase
  async getRole(roleName: string): Promise<object> {
    try {
      const roleDetails = await this.prisma.org_roles.findFirst({
        where: {
          name: roleName
        }
      });
      return roleDetails;
    } catch (error) {
      this.logger.error(`In get role repository: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Bad Request');
    }
  }

  async getOrgRoles(): Promise<IOrgRoles[]> {
    try {
      const roleDetails = await this.prisma.org_roles.findMany();
      const filteredRoles = roleDetails.filter((role) => role.name !== OrgRoles.PLATFORM_ADMIN);
      return filteredRoles;
    } catch (error) {
      this.logger.error(`In get org-roles repository: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Bad Request');
    }
  }

  // eslint-disable-next-line camelcase
  async getOrgRolesByIds(orgRoles: string[]): Promise<object[]> {
    try {
      const roleDetails = await this.prisma.org_roles.findMany({
        where: {
          id: {
            in: orgRoles
          }
        },
        select: {
          id: true,
          name: true,
          description: true
        }
      });
      return roleDetails;
    } catch (error) {
      this.logger.error(`In get org-roles by id repository : ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
