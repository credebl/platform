/* eslint-disable camelcase */
import { Injectable } from '@nestjs/common';
import { UserActivityRepository } from '../repositories';
import { user_activity } from '@credebl/prisma-service';
import { IUsersActivity } from '../interfaces';

@Injectable()
export class UserActivityService {
  constructor(private readonly userActivityRepository: UserActivityRepository) {}

  async createActivity(userId: string, orgId: string, action: string, details: string): Promise<user_activity> {
    return this.userActivityRepository.logActivity(userId, orgId, action, details);
  }

  async getUserActivity(userId: string, limit: number): Promise<IUsersActivity[]> {
    return this.userActivityRepository.getRecentActivities(userId, limit);
  }
}
