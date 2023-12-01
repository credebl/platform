/* eslint-disable camelcase */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@credebl/prisma-service';
import { user_activity } from '@prisma/client';

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


    async getRecentActivities(userId: string, limit: number): Promise<user_activity[]> {
        return this.prisma.user_activity.findMany({
            where: {
                userId
            },
            orderBy: {
                createDateTime: 'desc'
            },
            take: limit
        });
    }


}