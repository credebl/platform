import { Injectable, InternalServerErrorException, type Logger } from '@nestjs/common'

import type { PrismaService } from '@credebl/prisma-service'

import type { org_roles } from '@prisma/client'
import { OrgRoles } from '../enums'
import type { IOrgRoles } from '../interfaces/org-roles.interface'

@Injectable()
export class OrgRolesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async getRole(roleName: string): Promise<org_roles> {
    try {
      const roleDetails = await this.prisma.org_roles.findFirst({
        where: {
          name: roleName,
        },
      })
      return roleDetails
    } catch (error) {
      this.logger.error(`In get role repository: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException('Bad Request')
    }
  }

  async getOrgRoles(): Promise<IOrgRoles[]> {
    try {
      const roleDetails = await this.prisma.org_roles.findMany()
      const filteredRoles = roleDetails.filter((role) => role.name !== OrgRoles.PLATFORM_ADMIN)
      return filteredRoles
    } catch (error) {
      this.logger.error(`In get org-roles repository: ${JSON.stringify(error)}`)
      throw new InternalServerErrorException('Bad Request')
    }
  }

  async getOrgRolesByIds(orgRoles: string[]): Promise<object[]> {
    try {
      const roleDetails = await this.prisma.org_roles.findMany({
        where: {
          id: {
            in: orgRoles,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      })
      return roleDetails
    } catch (error) {
      this.logger.error(`In get org-roles by id repository : ${JSON.stringify(error)}`)
      throw error
    }
  }
}
