import { Injectable } from '@nestjs/common';
import { OrgRolesRepository } from '../repositories';
// eslint-disable-next-line camelcase
import { IOrgRoles } from '@credebl/common';
// eslint-disable-next-line camelcase
import { org_roles } from '@prisma/client';
@Injectable()
export class OrgRolesService {
  constructor(private readonly orgRoleRepository: OrgRolesRepository) {}

  // eslint-disable-next-line camelcase
  async getRole(roleName: string): Promise<org_roles> {
    return this.orgRoleRepository.getRole(roleName);
  }

  async getOrgRoles(): Promise<IOrgRoles[]> {
    return this.orgRoleRepository.getOrgRoles();
  }

  // eslint-disable-next-line camelcase
  async getOrgRolesByIds(orgRoleIds: string[]): Promise<object[]> {
    return this.orgRoleRepository.getOrgRolesByIds(orgRoleIds);
  }
}
