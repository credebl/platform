import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TrustServiceRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const realmRoles: string[] = user?.realm_access?.roles ?? [];

    if (!realmRoles.includes('trust-service')) {
      throw new ForbiddenException('Access restricted to trust-service clients only');
    }

    return true;
  }
}
