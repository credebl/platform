import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Request } from 'express';
import { UserRepository } from 'apps/user/repositories/user.repository';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies['session_id'];

    // if (!sessionId) {
    //   throw new UnauthorizedException('Missing session cookie');
    // }
    if (sessionId) {
      const user = await this.userRepository.validateSession(sessionId);
      request.user = user;
    }

    // if (!user) {
    //   throw new UnauthorizedException('Invalid session');
    // }
    return true;
  }
}
