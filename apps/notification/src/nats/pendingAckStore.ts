import { Injectable } from '@nestjs/common';
import { JsMsg } from 'nats';

type PendingKey = string;

interface PendingMessage {
  msg: JsMsg;
  receivedAt: number;
}

@Injectable()
export class PendingAckStore {
  private readonly store = new Map<PendingKey, PendingMessage>();

  makeKey(stream: string, consumer: string, streamSequence: number): PendingKey {
    return `${stream}:${consumer}:${streamSequence}`;
  }

  save(stream: string, consumer: string, msg: JsMsg): PendingKey {
    const { info } = msg;
    if (!info) {
      throw new Error('Cannot save message without info metadata');
    }
    const key = this.makeKey(stream, consumer, info.streamSequence);

    this.store.set(key, {
      msg,
      receivedAt: Date.now()
    });

    return key;
  }

  get(key: PendingKey): JsMsg | undefined {
    return this.store.get(key)?.msg;
  }

  delete(key: PendingKey): void {
    this.store.delete(key);
  }
}
