/* eslint-disable camelcase */
import { Injectable } from '@nestjs/common';
import { UserActivityRepository } from '../repositories';
import { RecordType, user_activity, user_org_delete_activity } from '@prisma/client';
import { IUsersActivity } from '../interface';

@Injectable()
export class UserActivityService {

    constructor(
        private readonly userActivityRepository: UserActivityRepository
    ) { }

    async createActivity(userId: string, orgId: string, action: string, details: string): Promise<user_activity> {
        
        return this.userActivityRepository.logActivity(userId, orgId, action, details);
    }

    async deletedRecordsDetails(userId: string, orgId: string, recordType: RecordType, txnMetadata:object): Promise<user_org_delete_activity> {
        return this.userActivityRepository.deletedActivity(userId, orgId, recordType, txnMetadata);
    }

    async getUserActivity(userId: string, limit: number): Promise<IUsersActivity[]> {
        return this.userActivityRepository.getRecentActivities(userId, limit);
    }
}
