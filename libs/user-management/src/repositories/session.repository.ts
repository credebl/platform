import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@credebl/prisma-service';

@Injectable()
export class SessionRepository {
  private readonly logger = new Logger('SessionRepository');

  constructor(private readonly prisma: PrismaService) {}

  async validateSession(sessionId: string): Promise<object> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });
    return session;
  }
}
