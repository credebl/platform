import { CanActivate, ExecutionContext, Logger } from '@nestjs/common';

import { HttpException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { OrgRoles } from 'libs/org-roles/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }            // eslint-disable-next-line array-callback-return


  private logger = new Logger('Org Role Guard');
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRoles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    const requiredRolesNames = Object.values(requiredRoles) as string[];

    if (!requiredRolesNames) {
      return true;
    }

    // Request requires org check, proceed with it
    const req = context.switchToHttp().getRequest();

    const { user } = req;

    if (req.params.orgId || req.query.orgId || req.body.orgId) {

      const orgId = req.params.orgId || req.query.orgId || req.body.orgId;

      const specificOrg = user.userOrgRoles.find((orgDetails) => {
        if (!orgDetails.orgId) {
          return false;
        }
        return orgDetails.orgId.toString() === orgId.toString();
      });

      if (!specificOrg) {
        throw new HttpException('Organization does not match', HttpStatus.FORBIDDEN);
      }

      user.selectedOrg = specificOrg;
      user.selectedOrg.orgRoles = user.userOrgRoles.map(roleItem => roleItem.orgRole.name);

    } else {
      throw new HttpException('organization is required', HttpStatus.BAD_REQUEST);
    }

    return requiredRoles.some((role) => user.selectedOrg?.orgRoles.includes(role));
  }
}