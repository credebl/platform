import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { NatsService } from './nats.service';
import { JetStreamConsumer } from './jetstream.consumer';
import { ensureStream } from './jetstream.setup';
import { TestSubsciber } from './nats-subscriber';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@credebl/common';
import { GlobalConfigModule } from '@credebl/config';
import { ConfigModule as PlatformConfig } from '@credebl/config/config.module';
import { LoggerModule } from '@credebl/logger';
import { ContextInterceptorModule } from '@credebl/context';
import { CacheModule } from '@nestjs/cache-manager';
import { PendingAckStore } from './pendingAckStore';
import { HolderNotificationRepository } from '../holder-notification.repository';
import { PrismaService } from '@credebl/prisma-service';

@Module({
  imports: [
    ConfigModule.forRoot(),

    CommonModule,
    GlobalConfigModule,
    LoggerModule,
    PlatformConfig,
    ContextInterceptorModule,
    CacheModule.register({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT })
  ],
  providers: [
    NatsService,
    JetStreamConsumer,
    TestSubsciber,
    Logger,
    PendingAckStore,
    HolderNotificationRepository,
    PrismaService
  ],
  exports: [NatsService]
})
export class NatsModule implements OnModuleInit {
  constructor(
    private readonly nats: NatsService,
    private readonly logger: Logger
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('[NATS] Module initializing...');
    await this.nats.connect();

    const jsm = this.nats.jetstreamManager();

    await ensureStream(jsm);
    // await ensureConsumer(jsm);
  }
}
