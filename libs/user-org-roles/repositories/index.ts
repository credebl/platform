import { Injectable, Logger } from '@nestjs/common';

import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';
// eslint-disable-next-line camelcase
import { user_org_roles } from '@prisma/client';
import { Prisma } from '@prisma/client';

type UserOrgRolesWhereUniqueInput = Prisma.user_org_rolesWhereUniqueInput;

@Injectable()
export class UserOrgRolesRepository {
  constructor(private readonly prisma: PrismaService, private readonly logger: Logger) {}

  /**
   *
   * @param createUserDto
   * @returns user details
   */
  // eslint-disable-next-line camelcase
  async createUserOrgRole(userId: string, roleId: string, orgId?: string): Promise<user_org_roles> {
    
    try {
      const data: {
        orgRole: { connect: { id: string } };
        user: { connect: { id: string } };
        organisation?: { connect: { id: string } };
      } = {
        orgRole: { connect: { id: roleId } },
        user: { connect: { id: userId } }
      };

      if (orgId) {
        data.organisation = { connect: { id: orgId } };
      }

      const saveResponse = await this.prisma.user_org_roles.create({
        data
      });
     
      return saveResponse;
     
    } catch (error) {
      this.logger.error(`UserOrgRolesRepository:: createUserOrgRole: ${error}`);
      throw new InternalServerErrorException('User Org Role not created');
    }
  }

  /**
   *
   * @param
   * @returns organizations details
   */
  // eslint-disable-next-line camelcase
  async getUserOrgData(queryOptions: object): Promise<user_org_roles[]> {
    try {
      return this.prisma.user_org_roles.findMany({
        where: {
          ...queryOptions
        },
        include: {
          organisation: {
            include: {
              // eslint-disable-next-line camelcase
              org_agents: true,
              orgInvitations: true
            }
          },
          orgRole: true
        }
      });
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async findAndUpdate(queryOptions: UserOrgRolesWhereUniqueInput, updateData: object): Promise<object> {
    try {
      return this.prisma.user_org_roles.update({
        where: { ...queryOptions },
        data: { ...updateData }
      });
    } catch (error) {
      this.logger.error(`error in findAndUpdate: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

  async deleteMany(queryOptions: object): Promise<object> {
    try {
      return this.prisma.user_org_roles.deleteMany({
        where: { ...queryOptions }
      });
    } catch (error) {
      this.logger.error(`error in deleteMany: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(error);
    }
  }

}
