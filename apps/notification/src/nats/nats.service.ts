import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { readFileSync } from 'fs';
import { connect, credsAuthenticator, JetStreamClient, JetStreamManager, KV, NatsConnection } from 'nats';
import path = require('node:path');

const creds = process.env.NATS_CREDS_FILE;
const utf8 = readFileSync(path.resolve(creds));
@Injectable()
export class NatsService implements OnModuleDestroy {
  public nc!: NatsConnection;
  private js!: JetStreamClient;
  private jsm!: JetStreamManager;
  private connected = false;
  private kv!: KV;

  constructor(private readonly logger: Logger) {}

  async connect(): Promise<NatsConnection> {
    if (this.connected) {
      return this.nc;
    }

    this.logger.log('[NATS] starting connection...');

    const { NATS_URL, NATS_USER, NATS_PASSWORD } = process.env;
    if (!NATS_URL || !NATS_USER || !NATS_PASSWORD) {
      throw new Error('Missing NATS connection env vars (NATS_URL, NATS_USER, NATS_PASSWORD)');
    }

    this.nc = await connect({
      servers: `${process.env.NATS_URL}`.split(','),
      // authenticator: usernamePasswordAuthenticator(`${process.env.NATS_USER}`, `${process.env.NATS_PASSWORD}`)
      authenticator: credsAuthenticator(utf8)
    });
    this.js = this.nc.jetstream();
    this.jsm = await this.nc.jetstreamManager();

    this.connected = true;
    this.logger.log('[NATS] connection established');
    return this.nc;
  }

  jetstream(): JetStreamClient {
    if (!this.connected) {
      throw new Error('NATS not connected yet');
    }
    return this.js;
  }

  jetstreamManager(): JetStreamManager {
    if (!this.connected) {
      throw new Error('NATS not connected yet');
    }
    return this.jsm;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
    }
  }

  async publish(subject: string, payload: unknown): Promise<void> {
    if (!this.connected) {
      throw new Error('NATS not connected yet');
    }
    this.nc.publish(subject, Buffer.from(JSON.stringify(payload)));
  }

  async getKV(bucketName: string): Promise<KV> {
    if (!this.connected) {
      throw new Error('NATS not connected yet');
    }
    if (!this.kv) {
      this.kv = await this.js.views.kv(bucketName);
    }
    return this.kv;
  }
}
