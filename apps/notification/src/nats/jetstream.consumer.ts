import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Consumer } from 'nats';
import { NatsService } from './nats.service';
import { CONSUMER, STREAM } from './jetstream.setup';

@Injectable()
export class JetStreamConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly nats: NatsService,
    private readonly logger: Logger
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const js = this.nats.jetstream(); // ✅ now safe

    const consumer: Consumer = await js.consumers.get(STREAM, CONSUMER);
    //  const consumer: Consumer = await js.consumers.get(
    //   STREAM,
    //   {
    //   //  name_prefix: CONSUMER,
    //    filterSubjects: ['hubStream.presentation.test.blr']
    //   }
    // );

    this.logger.log('[NATS] JetStream consumer started');

    this.consume(consumer).catch((err) => {
      this.logger.error('[NATS] Consumer crashed', err);
    });
  }

  private async consume(consumer: Consumer): Promise<void> {
    for await (const msg of await consumer.consume()) {
      try {
        const { subject } = msg;
        this.logger.log('[NATS] Message subject', subject);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, domain, event, orgCode, sessionId] = subject.split('.');

        this.logger.log({
          domain,
          event,
          orgCode,
          sessionId
        });

        const payload = msg.json();
        this.logger.log('[NATS] Message received', payload);

        await this.nats.publish('did-key', payload); // ACK reply to APP
        this.logger.log('[NATS] Message published to did:key:z6Mkm4VPWQRRSJSgoPVQ2oB8EfRqDGDQJBudpqppovJYeLpu');

        // business logic
        msg.ack();
      } catch (err) {
        this.logger.error('[NATS] Processing failed', err);
        msg.nak();
      }
    }
  }
}
