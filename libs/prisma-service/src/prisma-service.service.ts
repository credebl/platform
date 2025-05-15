import { type INestApplication, Injectable, type OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async enableShutdownHooks(_app: INestApplication): Promise<void> {}
}
