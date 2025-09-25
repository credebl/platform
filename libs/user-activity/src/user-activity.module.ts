import { Logger, Module } from '@nestjs/common';

import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from '../repositories';
import { UserActivityService } from './user-activity.service';
import { LoggerModule } from '@credebl/logger';

@Module({
  imports: [LoggerModule],
  providers: [UserActivityService, UserActivityRepository, Logger, PrismaService],
  exports: [UserActivityService]
})
export class UserActivityModule {}
