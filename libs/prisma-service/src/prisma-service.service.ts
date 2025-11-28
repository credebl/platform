/* eslint-disable @typescript-eslint/no-explicit-any */
import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('PrismaService');
  private prismaLogs: string[];

  private enable = (type: string): boolean => this.prismaLogs.includes(type);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
      ]
    });

    this.prismaLogs = String(process.env.PRISMA_LOGS || '')
      .toLowerCase()
      .split(',')
      .map((l) => l.trim());
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (this.enable('error')) {
      (this as any).$on('error', (e: Prisma.LogEvent) => {
        this.logger.error(JSON.stringify(e.message, null, 2), '', '(Prisma Error) Message:');
        this.logger.error(e.target, '', '(Prisma Error) Target:');
        this.logger.error(`${e.timestamp}ms`, '', '(Prisma Error) Timestamp:');
      });
    }
    if (this.enable('warn')) {
      (this as any).$on('warn', (e: Prisma.LogEvent) => {
        this.logger.warn(JSON.stringify(e.message, null, 2), '(Prisma Warn) Message:');
        this.logger.warn(e.target, '(Prisma Warn) Target:');
        this.logger.warn(`${e.timestamp}ms`, '(Prisma Warn) Timestamp:');
      });
    }
    if (this.enable('query')) {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        this.logger.debug(JSON.stringify(e.query, null, 2), '(Prisma Query) Query:');
        this.logger.debug(e.target, '(Prisma Query) Target:');
        this.logger.debug(`${e.timestamp}ms`, '(Prisma Query) Timestamp:');
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enableShutdownHooks(app: INestApplication): Promise<void> {}
}
