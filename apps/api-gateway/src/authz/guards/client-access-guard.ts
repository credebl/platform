import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ClientAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const { user } = request;

    if (!user || !Object.prototype.hasOwnProperty.call(user, 'client_id')) {
      throw new UnauthorizedException('You do not have access');
    }

    return true;
  }
}
