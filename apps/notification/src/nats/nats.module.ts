import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { NatsService } from './nats.service';
import { JetStreamConsumer } from './jetstream.consumer';
import { ensureConsumer, ensureStream } from './jetstream.setup';
import { TestSubsciber } from './nats-subscriber';

@Module({
  providers: [NatsService, JetStreamConsumer, TestSubsciber],
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
    await ensureConsumer(jsm);
  }
}
