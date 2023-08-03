import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  private readonly logger = new Logger('RolesGuard');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log(`Before permissions`);
    const permissions = this.reflector.get<string[]>('permissions', context.getHandler());
    this.logger.log(`permissions: ${permissions}`);

    if (!permissions) {
      this.logger.log(`No Permissions found.`);
      return true;
    }

    const subscription = this.reflector.get<string[]>('subscription', context.getHandler());
    this.logger.log(`subscription: ${subscription}`);

    if (!subscription) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.requestor;
    this.logger.log(`user request:: orgId: ${user.orgId}`);

    const userPermissions = user.userRoleOrgPermissions[0].role.permissions;

    const permsArray = [];

    userPermissions.every(
      permissions => permsArray.push(permissions.name)
    );

    return this.matchRoles(permsArray, permissions);
  }

  matchRoles(UserPermissions: string[], APIPermissions: string[]): boolean {
    this.logger.log('called matches permission');

    const checker = APIPermissions.some(function (val) {
      return 0 <= UserPermissions.indexOf(val);
    });

    if (checker) {
      return true;
    }
    return false;
  }
}
