import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserDevicesRepository: any;
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enableShutdownHooks(app: INestApplication): Promise<void> {
  }
}