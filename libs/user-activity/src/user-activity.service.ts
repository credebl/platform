/* eslint-disable camelcase */
import { Injectable } from '@nestjs/common';
import { UserActivityRepository } from '../repositories';
import { user_activity } from '@prisma/client';
import { IUsersActivity } from '../interface';

@Injectable()
export class UserActivityService {

    constructor(
        private readonly userActivityRepository: UserActivityRepository
    ) { }

    async createActivity(userId: string, orgId: string, action: string, details: string): Promise<user_activity> {
        
        return this.userActivityRepository.logActivity(userId, orgId, action, details);
    }

    async getUserActivity(userId: string, limit: number): Promise<IUsersActivity[]> {
        return this.userActivityRepository.getRecentActivities(userId, limit);
    }
}
