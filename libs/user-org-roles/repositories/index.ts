import { Injectable, type Logger } from '@nestjs/common'

import type { PrismaService } from '@credebl/prisma-service'
import { InternalServerErrorException } from '@nestjs/common'

import type { user_org_roles } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type UserOrgRolesWhereUniqueInput = Prisma.user_org_rolesWhereUniqueInput

@Injectable()
export class UserOrgRolesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  /**
   *
   * @param createUserDto
   * @returns user details
   */

  async createUserOrgRole(userId: string, roleId: string, orgId?: string, idpRoleId?: string): Promise<user_org_roles> {
    try {
      const data: {
        orgRole: { connect: { id: string } }
        user: { connect: { id: string } }
        organisation?: { connect: { id: string } }
        idpRoleId?: string
      } = {
        orgRole: { connect: { id: roleId } },
        user: { connect: { id: userId } },
      }

      if (orgId) {
        data.organisation = { connect: { id: orgId } }
      }

      if (idpRoleId) {
        data.idpRoleId = idpRoleId
      }

      const saveResponse = await this.prisma.user_org_roles.create({
        data,
      })

      return saveResponse
    } catch (error) {
      this.logger.error(`UserOrgRolesRepository:: createUserOrgRole: ${error}`)
      throw new InternalServerErrorException('User Org Role not created')
    }
  }

  /**
   *
   * @param
   * @returns organizations details
   */

  async getUserOrgData(queryOptions: object): Promise<user_org_roles[]> {
    try {
      return this.prisma.user_org_roles.findMany({
        where: {
          ...queryOptions,
        },
        include: {
          organisation: {
            include: {
              org_agents: true,
              orgInvitations: true,
            },
          },
          orgRole: true,
        },
      })
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException(error)
    }
  }

  async findAndUpdate(queryOptions: UserOrgRolesWhereUniqueInput, updateData: object): Promise<object> {
    try {
      return this.prisma.user_org_roles.update({
        where: { ...queryOptions },
        data: { ...updateData },
      })
    } catch (error) {
      this.logger.error(`error in findAndUpdate: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException(error)
    }
  }

  async deleteMany(queryOptions: object): Promise<object> {
    try {
      return this.prisma.user_org_roles.deleteMany({
        where: { ...queryOptions },
      })
    } catch (error) {
      this.logger.error(`error in deleteMany: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException(error)
    }
  }
}
