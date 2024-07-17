import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class UserRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const { user } = request;

    if (user?.userRole) {
      if (!user?.userRole.includes('holder')) {
        throw new ForbiddenException('This role is not a holder.');
      }
    }

    return true;
  }
}
