/* eslint-disable camelcase */
import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { IUsersActivity} from '../interface';
import { PrismaService } from '@credebl/prisma-service';
import { RecordType, user, user_activity } from '@prisma/client';
import { map } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserActivityRepository {
    constructor(private readonly prisma: PrismaService, private readonly logger: Logger, 
    @Inject('NATS_CLIENT') private readonly userActivityServiceProxy: ClientProxy
    ) { }


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

    async _orgDeletedActivity(orgId: string, user: user, txnMetadata: object, recordType: RecordType): Promise<{
        message: string;
      }> {
        try {
          const pattern = { cmd: 'org-deleted-activity' };
            const payload = { orgId, userId: user?.id, deletedBy: user?.id, recordType, userEmail: user?.email, txnMetadata };
        
            return this.userActivityServiceProxy
            .send<string>(pattern, payload)
            .pipe(
              map((message) => ({
                message
              }))
            )
            .toPromise()
            .catch((error) => {
              this.logger.error(`catch: ${JSON.stringify(error)}`);
    
              throw new HttpException(
                {
                  status: error?.error?.statusCode,
                  error: error?.error?.error,
                  message: error?.error?.message ?? error?.message
                },
                error.error
              );
            });
        } catch (error) {
          this.logger.error(`[_orgDeletedActivity] - error in delete wallet : ${JSON.stringify(error)}`);
          throw error;
        }
      }
}