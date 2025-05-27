import { Injectable } from '@nestjs/common'
import type { Logger } from '@nestjs/common'

import type { org_roles } from '@prisma/client'
import type { IOrgRoles } from '../interfaces/org-roles.interface'
import type { OrgRolesRepository } from '../repositories'
@Injectable()
export class OrgRolesService {
  constructor(
    private readonly orgRoleRepository: OrgRolesRepository,
    private readonly logger: Logger
  ) {}

  async getRole(roleName: string): Promise<org_roles> {
    return this.orgRoleRepository.getRole(roleName)
  }

  async getOrgRoles(): Promise<IOrgRoles[]> {
    return this.orgRoleRepository.getOrgRoles()
  }

  async getOrgRolesByIds(orgRoleIds: string[]): Promise<object[]> {
    return this.orgRoleRepository.getOrgRolesByIds(orgRoleIds)
  }
}
