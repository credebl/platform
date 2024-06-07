/* eslint-disable camelcase */
import { Injectable, Logger } from '@nestjs/common';
import { IUsersActivity} from '../interface';
import { PrismaService } from '@credebl/prisma-service';
import { RecordType, user_activity, user_org_delete_activity } from '@prisma/client';

@Injectable()
export class UserActivityRepository {
    constructor(private readonly prisma: PrismaService, private readonly logger: Logger) { }


    async logActivity(userId: string, orgId: string, action: string, details: string): Promise<user_activity> {
        return this.prisma.user_activity.create({
            data: {
                userId,
                orgId,
                action,
                details,
                createdBy: userId,
                lastChangedBy: userId
            }
        });
    }

    async deletedActivity(userId: string, orgId: string, recordType: RecordType, txnMetadata:object): Promise<user_org_delete_activity> {

        return this.prisma.user_org_delete_activity.create({
            data: {
                userId,
                orgId,
                recordType,
                txnMetadata,
                createdBy: userId,
                lastChangedBy: userId
            }
        });
    }

    async getRecentActivities(userId: string, limit: number): Promise<IUsersActivity[]> {
        return this.prisma.user_activity.findMany({
            where: {
                userId
            },
            select: {
                id: true,
                userId: true,
                orgId: true,
                action: true,
                details: true,
                createDateTime:true,
                lastChangedDateTime: true
            },
            orderBy: {
                createDateTime: 'desc'
            },
            take: limit
        });
    }


}