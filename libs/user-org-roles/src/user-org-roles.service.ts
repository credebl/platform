import { Injectable } from '@nestjs/common';
import { UserOrgRolesRepository } from '../repositories';
// eslint-disable-next-line camelcase
import { user_org_roles } from '@prisma/client';

@Injectable()
export class UserOrgRolesService {
  constructor(private readonly userOrgRoleRepository: UserOrgRolesRepository) {}

  /**
   *
   * @param createUserDto
   * @returns user details
   */
  // eslint-disable-next-line camelcase
  async createUserOrgRole(userId: string, roleId: string, orgId?: string, idpRoleId?: string): Promise<user_org_roles> {
    return this.userOrgRoleRepository.createUserOrgRole(userId, roleId, orgId, idpRoleId);
  }


  /**
   * 
   * @param userId 
   * @param orgId 
   * @returns Boolean response for user exist
   */
  async checkUserOrgExist(userId: string, orgId: string): Promise<boolean> {
    const queryOptions = {
      userId,
      orgId
    };
    const userOrgDetails = await this.userOrgRoleRepository.getUserOrgData(queryOptions);

    if (userOrgDetails && 0 === userOrgDetails.length) {
      return false;
    }

    return true;
  }


  /**
   * 
   * @param userId 
   * @param orgId 
   * @param roleIds 
   * @returns 
   */
  async updateUserOrgRole(
    userId: string,
    orgId: string,
    roleIdList: {roleId: string, idpRoleId: string}[]
     ): Promise<boolean> {
  
    for (const roleData of roleIdList) {
      this.userOrgRoleRepository.createUserOrgRole(userId, roleData.roleId, orgId, roleData.idpRoleId);
    }

    return true;
  }

  /**
   * 
   * @param userId 
   * @param orgId 
   * @returns Delete user org roles
   */
  async deleteOrgRoles(userId: string, orgId: string): Promise<object> {

    const queryOptions = {
      userId,
      orgId
    };

    return this.userOrgRoleRepository.deleteMany(queryOptions);

  }
}
