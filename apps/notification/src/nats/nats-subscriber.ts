import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { NatsService } from './nats.service';

const sd = new TextDecoder();
@Injectable()
export class TestSubsciber implements OnApplicationBootstrap {
  constructor(
    private readonly nats: NatsService,
    private readonly logger: Logger
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    //    this.subscribe('activate.user', async (data) => {
    //         this.logger.log('[NATS] TestSubsciber received data:', data);
    //     });
  }

  private async subscribe(subject: string, handler: (data: unknown) => void | Promise<void>): Promise<void> {
    try {
      this.logger.log('[NATS] Setting up subscription', {
        subject
      });
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
            this.logger.error('[NATS] Error processing subscribed message', {
              subject,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      })();

      this.logger.log('[NATS] Subscription active', {
        subject
      });
    } catch (error) {
      this.logger.error('[NATS] Failed to set up subscription', {
        subject,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
