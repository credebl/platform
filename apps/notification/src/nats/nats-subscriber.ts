import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NatsService } from './nats.service';
import { INatsUserRequestData } from './interfaces';
import { ensureSessionConsumer, STREAM } from './jetstream.setup';
import { JetStreamClient } from 'nats';
import { PendingAckStore } from './pendingAckStore';

const sd = new TextDecoder();
@Injectable()
export class TestSubsciber implements OnApplicationBootstrap {
  constructor(
    private readonly nats: NatsService,
    private readonly logger: Logger,
    private readonly pendingAckStore: PendingAckStore
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.subscribe('active.user', async (data) => {
      this.logger.log(`[NATS] activate.user Subsciber received data: ${JSON.stringify(data)}`);
      await this.activateUserConsumers(data as INatsUserRequestData);
    });

    this.subscribe('user.ack', async (data) => {
      this.logger.log('[NATS] user.ack Subsciber received data:', data);
      await this.handleUserAck(data as { ackKey: string });
    });
  }

  private async subscribe(subject: string, handler: (data: unknown) => void | Promise<void>): Promise<void> {
    try {
      this.logger.log(`[NATS] Setting up subscription ${JSON.stringify(subject)}`);
      const nc = await this.nats.nc;
      const subscription = nc.subscribe(subject);

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      (async () => {
        for await (const msg of subscription) {
          try {
            const rawData = sd.decode(msg.data);
            const data = JSON.parse(rawData);
            await handler(data);
          } catch (error) {
            this.logger.error(
              `[NATS] Error processing subscribed message ${JSON.stringify({
                subject,
                error: error instanceof Error ? error.message : 'Unknown error'
              })}`
            );
          }
        }
      })();

      this.logger.log('[NATS] Subscription active', {
        subject
      });
    } catch (error) {
      this.logger.error(
        `[NATS] Failed to set up subscription ${JSON.stringify({
          subject,
          error: error instanceof Error ? error.message : 'Unknown error'
        })}`
      );
      throw error;
    }
  }

  private async activateUserConsumers(data: INatsUserRequestData): Promise<void> {
    const { did, sessions } = data;

    const js = this.nats.jetstream();
    const jsm = this.nats.jetstreamManager();
    this.logger.log(`[NATS] Started activating consumer for user DID: ${did} with sessions count: ${sessions.length}`);

    // Create all consumers in parallel first (dependency)
    await Promise.all(sessions.map((session) => ensureSessionConsumer(jsm, session.sessionId)));

    // After all consumers are created, consume messages from all sessions in parallel
    await Promise.all(sessions.map((session) => this.consumeSessionMessages(js, session.sessionId, did)));
  }

  private async consumeSessionMessages(js: JetStreamClient, sessionId: string, did: string): Promise<void> {
    const consumerName = `notify-session-${sessionId}`;
    this.logger.log(`[NATS] Getting consumer ${consumerName} to fetch messages for session ${sessionId}`);
    const consumer = await js.consumers.get(STREAM, consumerName);

    const iter = await consumer.fetch({
      // eslint-disable-next-line camelcase
      max_messages: 10
    });
    this.logger.log(`[NATS] Started fetching messages for consumer ${consumerName}`);
    for await (const msg of iter) {
      const payload = msg.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, domain, event, orgCode, sessionId] = msg.subject.split('.');

      const ackKey = this.pendingAckStore.save('notify', consumerName, msg);

      await this.nats.publish(`${did}`, {
        payload,
        ackKey, // opaque token user must return
        subject: msg.subject,
        event: `${domain}.${event}`
      });
      this.logger.log(`[NATS] Published message to user DID ${did} for session ${sessionId}`);
    }
    this.logger.log(`[NATS] Finished processing messages for session ${sessionId}, deleting consumer ${consumerName}`);
    await this.nats.jetstreamManager().consumers.delete(STREAM, consumerName);
    this.logger.log(`[NATS] Deleted consumer ${consumerName} after processing messages for session ${sessionId}`);
  }

  async handleUserAck(data: { ackKey: string }): Promise<void> {
    const msg = this.pendingAckStore.get(data.ackKey);

    if (!msg) {
      this.logger.warn('[NATS] ACK received but message not found or already acked', data);
      return;
    }

    try {
      msg.ack();
      this.pendingAckStore.delete(data.ackKey);
      this.logger.log('[NATS] Message ACKed via user confirmation');
    } catch (err) {
      this.logger.error(`[NATS] Failed to ACK message ${JSON.stringify(err)}`);
    }
  }
}
