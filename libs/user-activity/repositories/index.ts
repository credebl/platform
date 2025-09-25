/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { IUsersActivity } from '../interface';
import { PrismaService } from '@credebl/prisma-service';
import { RecordType, user, user_activity } from '@prisma/client';
import { lastValueFrom, timeout } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserActivityRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    @Inject('NATS_CLIENT') private readonly userActivityServiceProxy: ClientProxy
  ) {}

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
        createDateTime: true,
        lastChangedDateTime: true
      },
      orderBy: {
        createDateTime: 'desc'
      },
      take: limit
    });
  }

  async _orgDeletedActivity(
    orgId: string,
    user: user,
    txnMetadata: object,
    recordType: RecordType
  ): Promise<{
    message: string;
  }> {
    try {
      const pattern = { cmd: 'org-deleted-activity' };
      const payload = { orgId, userId: user?.id, deletedBy: user?.id, recordType, userEmail: user?.email, txnMetadata };

      const resp = await lastValueFrom(this.userActivityServiceProxy.send(pattern, payload).pipe(timeout(10000)));

      if ('string' === typeof resp) {
        return { message: resp };
      }
      if (resp && 'string' === typeof (resp as any).message) {
        return { message: (resp as any).message };
      }
      return { message: 'OK' };
    } catch (error) {
      this.logger.error(`[_orgDeletedActivity] - NATS 'org-deleted-activity' failed`, (error as any)?.stack);
      const status =
        (error as any)?.status ??
        (error as any)?.statusCode ??
        (error as any)?.error?.statusCode ??
        HttpStatus.INTERNAL_SERVER_ERROR;
      const response = {
        status,
        error: (error as any)?.name ?? (error as any)?.error?.error ?? 'InternalServerError',
        message: (error as any)?.message ?? (error as any)?.error?.message ?? 'Internal server error'
      };
      throw new HttpException(response, status);
    }
  }
}
