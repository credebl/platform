import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';

import { Injectable } from '@nestjs/common';
import { OrgRoles } from 'libs/org-roles/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Reflector } from '@nestjs/core';
import { ResponseMessages } from '@credebl/common/response-messages';
import { validate as isValidUUID } from 'uuid';
import { OrganizationService } from '../../organization/organization.service';
// import { Inject, forwardRef } from '@nestjs/common';
@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private organizationService: OrganizationService
  ) {} // eslint-disable-next-line array-callback-return

  private logger = new Logger('Org Role Guard');
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('OrgRolesGuard#canActivate called');
    const requiredRoles = this.reflector.getAllAndOverride<OrgRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const requiredRolesNames = Object.values(requiredRoles) as string[];
    this.logger.debug(`Required Roles: ${JSON.stringify(requiredRolesNames)}`);
    if (!requiredRolesNames) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const { user } = req;
    this.logger.debug(`User Details in OrgRolesGuard: ${JSON.stringify(user)}`);
    if (user?.userRole && user?.userRole.includes('holder')) {
      throw new ForbiddenException('This role is a holder.');
    }

    req.params.orgId = req.params?.orgId ? req.params?.orgId?.trim() : '';
    req.query.orgId = req.query?.orgId ? req.query?.orgId?.trim() : '';
    req.body.orgId = req.body?.orgId ? req.body?.orgId?.trim() : '';

    const orgId = req.params.orgId || req.query.orgId || req.body.orgId;

    if (orgId) {
      if (!isValidUUID(orgId)) {
        throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
      }
      // fetch organization roles from database and match with required roles
      // remove token base role dependency here
      const organizationDetails = await this.organizationService.getUserOrgRoles(user.id, orgId);
      this.logger.debug(`Organization Details: ${JSON.stringify(organizationDetails)}`);

      if (organizationDetails && organizationDetails.orgRole) {
        const { orgRole } = organizationDetails;
        const roleAccess = requiredRoles.some((role) => orgRole.name === role);

        if (!roleAccess) {
          throw new ForbiddenException(ResponseMessages.organisation.error.roleNotMatch, {
            cause: new Error(),
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
          cause: new Error(),
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
    } else if (requiredRolesNames.includes(OrgRoles.PLATFORM_ADMIN)) {
      // eslint-disable-next-line array-callback-return
      const isPlatformAdmin = user.userOrgRoles.find((orgDetails) => {
        if (orgDetails.orgRole.name === OrgRoles.PLATFORM_ADMIN) {
          return true;
        }
      });

      if (isPlatformAdmin) {
        return true;
      }

      return false;
    } else {
      throw new BadRequestException('Please provide valid orgId');
    }

    // Sending user friendly message if a user attempts to access an API that is inaccessible to their role
    const roleAccess = requiredRoles.some((role) => user.selectedOrg?.orgRoles.includes(role));
    if (!roleAccess) {
      throw new ForbiddenException(ResponseMessages.organisation.error.roleNotMatch, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.forbidden
      });
    }

    return roleAccess;
  }
}
