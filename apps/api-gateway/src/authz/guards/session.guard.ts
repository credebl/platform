import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Request } from 'express';
import { SessionRepository } from '@credebl/user-management';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly userRepository: SessionRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies['session_id'];
    if (sessionId) {
      const user = await this.userRepository.validateSession(sessionId);
      request.user = user;
    }
    return true;
  }
}
