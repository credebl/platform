import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

import { Injectable } from '@nestjs/common';
import { OrgRoles } from 'libs/org-roles/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Reflector } from '@nestjs/core';
import { ResponseMessages } from '@credebl/common/response-messages';
import { validate as isValidUUID } from 'uuid';

@Injectable()
export class EcosystemRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {} // eslint-disable-next-line array-callback-return

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!requiredRoles || 0 === requiredRoles.length) {
      return true;
    }
    const requiredRolesNames = requiredRoles as string[];
    const reqData = context.switchToHttp().getRequest();
    const { user } = reqData;

    let orgId = '';

    switch (true) {
      case 'string' === typeof reqData.params?.orgId:
        orgId = reqData.params.orgId.trim();
        break;

      case 'string' === typeof reqData.query?.orgId:
        orgId = reqData.query.orgId.trim();
        break;

      case 'string' === typeof reqData.body?.orgId:
        orgId = reqData.body.orgId.trim();
        break;

      default:
        orgId = '';
    }

    const isPlatformAdmin = user.email === process.env.PLATFORM_ADMIN_EMAIL;

    if (user?.ecosystemRoles && requiredRolesNames.some((role: string) => user.ecosystemRoles.includes(role))) {
      return true;
    }

    if (isPlatformAdmin && requiredRolesNames.includes(OrgRoles.PLATFORM_ADMIN)) {
      // eslint-disable-next-line array-callback-return
      const isPlatformAdminFlag = user.userOrgRoles.find((orgDetails) => {
        if (orgDetails.orgRole.name === OrgRoles.PLATFORM_ADMIN) {
          return true;
        }
      });

      if (isPlatformAdminFlag) {
        return true;
      }
    }

    if (orgId) {
      if (!isValidUUID(orgId)) {
        throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
      }

      if (user.hasOwnProperty('resource_access') && user.resource_access[orgId]) {
        const orgRoles: string[] = user.resource_access[orgId].roles;
        const roleAccess = requiredRoles.some((role) => orgRoles.includes(role));

        if (!roleAccess) {
          throw new ForbiddenException(ResponseMessages.organisation.error.roleNotMatch, {
            cause: new Error('error'),
            description: ResponseMessages.errorMessages.forbidden
          });
        }
        return roleAccess;
      }

      const specificOrg = user.userOrgRoles.find((orgDetails) => {
        if (!orgDetails.orgId) {
          return false;
        }
        return orgDetails.orgId.toString().trim() === orgId.toString().trim();
      });

      if (!specificOrg) {
        throw new ForbiddenException(ResponseMessages.organisation.error.orgNotMatch, {
          cause: new Error('error'),
          description: ResponseMessages.errorMessages.forbidden
        });
      }

      user.selectedOrg = specificOrg;
      // eslint-disable-next-line array-callback-return
      user.selectedOrg.orgRoles = user.userOrgRoles
        .filter((orgRoleItem) => orgRoleItem.orgId && orgRoleItem.orgId.toString().trim() === orgId.toString().trim())
        .map((orgRoleItem) => orgRoleItem.orgRole.name);
    } else {
      return false;
    }

    // Sending user friendly message if a user attempts to access an API that is inaccessible to their role
    const roleAccess = requiredRoles.some((role) => user.selectedOrg?.orgRoles.includes(role));
    if (!roleAccess) {
      throw new ForbiddenException(ResponseMessages.organisation.error.roleNotMatch, {
        cause: new Error('error'),
        description: ResponseMessages.errorMessages.forbidden
      });
    }

    return roleAccess;
  }
}
