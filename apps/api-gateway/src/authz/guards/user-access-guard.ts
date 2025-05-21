import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Observable } from 'rxjs'

@Injectable()
export class UserAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()

    const { user } = request

    // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
    if (user.hasOwnProperty('client_id')) {
      throw new UnauthorizedException('You do not have access')
    }

    if (user?.userRole?.includes('holder')) {
      throw new ForbiddenException('This role is a holder.')
    }

    return true
  }
}
