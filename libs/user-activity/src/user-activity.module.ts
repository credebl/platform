import { Logger, Module } from '@nestjs/common';

import { PrismaService } from '@credebl/prisma-service';
import { UserActivityRepository } from '../repositories';
import { UserActivityService } from './user-activity.service';

@Module({
  providers: [UserActivityService, UserActivityRepository, Logger, PrismaService],
  exports: [UserActivityService]
})
export class UserActivityModule {}
