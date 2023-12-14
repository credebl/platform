import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { OrgRolesRepository } from '../repositories';
// eslint-disable-next-line camelcase
import { org_roles } from '@prisma/client';
import { IOrgRoles } from '../interfaces/org-roles.interface';
@Injectable()
export class OrgRolesService {
    
    constructor(private readonly orgRoleRepository: OrgRolesRepository, private readonly logger: Logger) { }

    // eslint-disable-next-line camelcase
    async getRole(roleName: string): Promise<org_roles> {
        return this.orgRoleRepository.getRole(roleName);
    }

    async getOrgRoles(): Promise< IOrgRoles[]> {
        return this.orgRoleRepository.getOrgRoles();
    }

    // eslint-disable-next-line camelcase
    async getOrgRolesByIds(orgRoleIds: string[]): Promise<object[]> {
        return this.orgRoleRepository.getOrgRolesByIds(orgRoleIds);
    }
}
