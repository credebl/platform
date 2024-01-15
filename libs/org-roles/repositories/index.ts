import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { org_roles } from '@prisma/client';
import { OrgRoles } from '../enums';
import { IOrgRoles } from '../interfaces/org-roles.interface';

@Injectable()
export class OrgRolesRepository {
  constructor(private readonly prisma: PrismaService, private readonly logger: Logger) {}

  // eslint-disable-next-line camelcase
  async getRole(roleName: string): Promise<org_roles> {
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
            const filteredRoles = roleDetails.filter(role => role.name !== OrgRoles.PLATFORM_ADMIN);
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
                    id:{
                        in:orgRoles
                    }
                },
                select: {
                    id: true,
                    name: true, 
                    description: true
                }
            });
            this.logger.log(`In getroleDetails: ${JSON.stringify(roleDetails)}`);

            return roleDetails;
        } catch (error) {
            this.logger.error(`In get org-roles by id repository : ${JSON.stringify(error)}`);
            throw error;
        }
    }
}