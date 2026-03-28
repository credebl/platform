import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { readFileSync } from 'fs';
import {
  Authenticator,
  connect,
  credsAuthenticator,
  JetStreamClient,
  JetStreamManager,
  KV,
  NatsConnection,
  nkeyAuthenticator,
  usernamePasswordAuthenticator
} from 'nats';
import path = require('node:path');

type NatsAuthType = 'nkey' | 'creds' | 'usernamePassword' | 'none';

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

    const { NATS_URL, NOTIFICATION_NKEY_SEED, NATS_CREDS_FILE, NATS_USER, NATS_PASSWORD } = process.env;

    if (!NATS_URL) {
      throw new Error('NATS_URL is required');
    }

    const authType =
      (process.env.NOTIFICATION_NATS_AUTH_TYPE as NatsAuthType) ||
      (process.env.NATS_AUTH_TYPE as NatsAuthType) ||
      'nkey';

    const options: { servers: string[]; authenticator?: Authenticator } = {
      servers: NATS_URL.split(',')
    };

    switch (authType) {
      case 'creds':
        if (NATS_CREDS_FILE) {
          const utf8 = readFileSync(path.resolve(NATS_CREDS_FILE));
          options.authenticator = credsAuthenticator(utf8);
        }
        break;

      case 'usernamePassword':
        if (NATS_USER && NATS_PASSWORD) {
          options.authenticator = usernamePasswordAuthenticator(NATS_USER, NATS_PASSWORD);
        }
        break;

      case 'none':
        break;

      case 'nkey':
      default:
        if (NOTIFICATION_NKEY_SEED) {
          options.authenticator = nkeyAuthenticator(new TextEncoder().encode(NOTIFICATION_NKEY_SEED));
        }
        break;
    }
    this.nc = await connect(options);
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
