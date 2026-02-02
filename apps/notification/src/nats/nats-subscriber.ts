import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NatsService } from './nats.service';
import { PendingAckStore } from './pendingAckStore';

const sd = new TextDecoder();
export const EVENT_USER_ACK = 'user.ack';
@Injectable()
export class NotificationNATSSubsciber implements OnApplicationBootstrap {
  constructor(
    private readonly nats: NatsService,
    private readonly logger: Logger,
    private readonly pendingAckStore: PendingAckStore
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.subscribe(EVENT_USER_ACK, async (data) => {
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
