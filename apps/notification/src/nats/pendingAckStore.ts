import { Injectable, Logger } from '@nestjs/common';
import { JsMsg, KV, KvEntry, Msg } from 'nats';
import { NatsService } from './nats.service';

type PendingKey = string;

interface PendingMessageMetadata {
  reply: string;
  stream: string;
  consumer: string;
  streamSequence: number;
  subject: string;
  receivedAt: number;
}

@Injectable()
export class PendingAckStore {
  private readonly KV_BUCKET = 'PENDING_ACK';

  constructor(
    private readonly natsService: NatsService,
    private readonly logger: Logger
  ) {}

  private async getKV(): Promise<KV> {
    return this.natsService.getKV(this.KV_BUCKET);
  }

  makeKey(stream: string, consumer: string, streamSequence: number): PendingKey {
    return `${stream}-${consumer}-${streamSequence}`;
  }

  async save(stream: string, consumer: string, msg: JsMsg): Promise<PendingKey> {
    const { info } = msg;
    if (!info) {
      throw new Error('Cannot save message without info metadata');
    }
    const key = this.makeKey(stream, consumer, info.streamSequence);

    const jsMsg = msg as unknown as Msg;
    if (!jsMsg.reply) {
      throw new Error('Cannot save message without reply subject');
    }
    const metadata: PendingMessageMetadata = {
      reply: jsMsg.reply,
      stream,
      consumer,
      streamSequence: info.streamSequence,
      subject: msg.subject,
      receivedAt: Date.now()
    };

    const kv = await this.getKV();
    await kv.put(key, JSON.stringify(metadata));

    return key;
  }

  async get(key: PendingKey): Promise<JsMsg | undefined> {
    try {
      const kv = await this.getKV();
      const entry: KvEntry | null = await kv.get(key);

      if (!entry) {
        return undefined;
      }

      const metadata: PendingMessageMetadata = JSON.parse(new TextDecoder().decode(entry.value));

      const mockMsg = {
        reply: metadata.reply,
        ack: async () => {
          const nc = await this.natsService.connect();
          nc.publish(metadata.reply);
        },
        nak: async (delay?: number) => {
          const nc = await this.natsService.connect();
          nc.publish(metadata.reply, Buffer.from(`-NAK${delay ? ` ${delay}` : ''}`));
        }
      } as unknown as JsMsg;

      return mockMsg;
    } catch (error) {
      this.logger.warn(`Failed to retrieve pending ACK for key ${key}`, error);
      return undefined;
    }
  }

  async delete(key: PendingKey): Promise<void> {
    const kv = await this.getKV();
    await kv.delete(key);
  }
}
