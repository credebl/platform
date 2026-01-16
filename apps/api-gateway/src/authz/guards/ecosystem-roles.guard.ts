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
    const requiredRolesNames = Object.values(requiredRoles) as string[];

    if (!requiredRolesNames) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const { user } = req;

    if (user?.userRole && user?.userRole.includes('holder')) {
      throw new ForbiddenException('This role is a holder.');
    }

    req.params.orgId = req.params?.orgId ? req.params?.orgId?.trim() : '';
    req.query.orgId = req.query?.orgId ? req.query?.orgId?.trim() : '';
    req.body.orgId = req.body?.orgId ? req.body?.orgId?.trim() : '';

    const orgId = req.params.orgId || req.query.orgId || req.body.orgId;

    const isPlatformAdmin = user.email === process.env.PLATFORM_ADMIN_EMAIL;

    if (user?.ecosystemRoles && requiredRolesNames.some((role: string) => user.ecosystemRoles.includes(role))) {
      return true;
    }

    if (isPlatformAdmin && requiredRolesNames.includes(OrgRoles.PLATFORM_ADMIN)) {
      // eslint-disable-next-line array-callback-return
      const isPlatformAdmin = user.userOrgRoles.find((orgDetails) => {
        if (orgDetails.orgRole.name === OrgRoles.PLATFORM_ADMIN) {
          return true;
        }
      });

      if (isPlatformAdmin) {
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
          console.log("message 1")
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
        console.log("message 2")
        throw new ForbiddenException(ResponseMessages.organisation.error.orgNotMatch, {
          cause: new Error('error'),
          description: ResponseMessages.errorMessages.forbidden
        });
      }

      user.selectedOrg = specificOrg;
      // eslint-disable-next-line array-callback-return
      user.selectedOrg.orgRoles = user.userOrgRoles.map((orgRoleItem) => {
        if (orgRoleItem.orgId && orgRoleItem.orgId.toString().trim() === orgId.toString().trim()) {
          return orgRoleItem.orgRole.name;
        }
      });
    } else {
      return false;
    }

    // Sending user friendly message if a user attempts to access an API that is inaccessible to their role
    const roleAccess = requiredRoles.some((role) => user.selectedOrg?.orgRoles.includes(role));
    if (!roleAccess) {
      console.log("message last")
      throw new ForbiddenException(ResponseMessages.organisation.error.roleNotMatch, {
        cause: new Error('error'),
        description: ResponseMessages.errorMessages.forbidden
      });
    }

    return roleAccess;
  }
}
