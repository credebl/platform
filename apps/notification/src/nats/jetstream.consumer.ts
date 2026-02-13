import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Consumer } from 'nats';
import { NatsService } from './nats.service';
import {
  DID_STREAM,
  ensureConsumer,
  ensureDidStream,
  publishToJetStream,
  PULL_CONSUMER,
  AGGREGATE_STREAM
} from './jetstream.setup';
import { PendingAckStore } from './pendingAckStore';
import { HolderNotificationRepository } from '../holder-notification.repository';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import * as admin from 'firebase-admin';
import { IHolderNotification } from '@credebl/common/interfaces/holder-notification.interfaces';

const EVENT_PRESENTATION_ACK = 'presentation.ack';
const EVENT_PRESENTATION_PURGED = 'presentation.purged';
@Injectable()
export class JetStreamConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly nats: NatsService,
    private readonly logger: Logger,
    private readonly pendingAckStore: PendingAckStore,
    private readonly holderNotificationRepository: HolderNotificationRepository
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!admin.apps.length) {
      const projectId = process.env.PROJECT_ID;
      const clientEmail = process.env.CLIENT_EMAIL;
      const privateKey = process.env.PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase credentials: PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY are required');
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n')
        })
      });
    }

    const js = this.nats.jetstream(); // ✅ now safe

    const jsm = this.nats.jetstreamManager();
    await ensureConsumer(jsm);
    const consumer: Consumer = await js.consumers.get(AGGREGATE_STREAM, PULL_CONSUMER);

    this.logger.log('[NATS] JetStream consumer started');

    this.consume(consumer).catch((err) => {
      this.logger.error('[NATS] Consumer crashed', err);
    });
  }

  private async consume(consumer: Consumer): Promise<void> {
    this.logger.log(`[NATS] Starting to consume messages from consumer ${consumer.info}`);
    const WAIT_BEFORE_TRYING_REDELIVERY_MS = process.env.CONSUMER_CONFIG_ACK_WAIT
      ? Number(process.env.CONSUMER_CONFIG_ACK_WAIT)
      : 10000;
    for await (const msg of await consumer.consume()) {
      try {
        const { subject } = msg;
        this.logger.log(`[NATS] Message subject: ${subject}`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, domain, event, orgCode, sessionId] = subject.split('.');
        this.logger.log({
          domain,
          event,
          orgCode,
          sessionId
        });

        const payload = msg.json();
        this.logger.debug(`[NATS] Message received ${JSON.stringify(payload)}`);
        this.logger.log(`[NATS] Processing message, ${JSON.stringify({ deliveryCount: msg.info.deliveryCount })}`);
        const notificationDetail = await this.holderNotificationRepository.getHolderNotificationBySessionId(sessionId);

        const maxDeliver = process.env.CONSUMER_CONFIG_MAX_DELIVER
          ? Number(process.env.CONSUMER_CONFIG_MAX_DELIVER)
          : 4;
        if (maxDeliver - 1 < msg.info.deliveryCount) {
          //------------ Moving message to DID stream ---------------//
          await this.moveMsgToDidStream(notificationDetail, msg);

          //------------- Sending Push Notification via FCM ----------------//
          this.sendNotificationToHolder(event, orgCode, notificationDetail);
          msg.ack();
        } else {
          // ------------- Publishing Messages via NATS ----------------//
          // Last delivery attempt - wait for user confirmation before ACKing

          this.logger.log(`[NATS] Notification detail fetched for session ID: ${sessionId}`);
          if (!notificationDetail) {
            this.logger.error(`[NATS] No notification detail found for session ID: ${sessionId}`);
            msg.nak(WAIT_BEFORE_TRYING_REDELIVERY_MS);
            continue;
          }

          const ackKey = await this.pendingAckStore.save(AGGREGATE_STREAM, PULL_CONSUMER, msg);

          await this.nats.publish(`${notificationDetail.holderDid}`, {
            payload,
            ackKey,
            subject: msg.subject,
            event: `${domain}.${event}`
          });

          this.logger.log(`[NATS] Message published to ${notificationDetail.holderDid} for session ${sessionId}`);
          // DO NOT ack here - waiting for user confirmation via user.ack
        }

        // business logic
        // msg.ack();
      } catch (err) {
        this.logger.error(`[NATS] Processing failed ${JSON.stringify({ error: err.message, stack: err.stack })}`);
        msg.nak(WAIT_BEFORE_TRYING_REDELIVERY_MS);
      }
    }
  }

  private sendNotificationToHolder(event: string, orgCode: string, notificationDetail: IHolderNotification): void {
    let notificationTitle = '';
    if (EVENT_PRESENTATION_ACK === event) {
      notificationTitle = `Your data delivered to ${orgCode}`;
    } else if (EVENT_PRESENTATION_PURGED === event) {
      notificationTitle = `Your data purged from ${orgCode}`;
    }
    this.logger.log('Now push notifications will be sent to user');
    const notificationPayload: Message = {
      notification: {
        title: notificationTitle,
        body: `Open an app to view more details`
      },
      token: notificationDetail.fcmToken
    };
    // Send the notification to the specified device
    admin
      .messaging()
      .send(notificationPayload)
      .then((response) => {
        this.logger.log('Successfully sent message:', response);
      })
      .catch((error) => {
        this.logger.error('Error sending message:', error);
      });
  }

  private async moveMsgToDidStream(notificationDetail: IHolderNotification, msg): Promise<void> {
    this.logger.log('[NATS] Moving message to DID stream for FCM notification');
    //const notifyStream = process.env.STREAM_NOTIFY ?? "notify";
    const subjectName = `${DID_STREAM}.${notificationDetail.holderDid}`;
    const jsm = this.nats.jetstreamManager();
    const jsc = this.nats.jetstream();
    await ensureDidStream(jsm);

    const decoder = new TextDecoder(); // or 'UTF-8', 'windows-1251', etc.
    const msgData = decoder.decode(msg.data);

    //await ensureStreamExists(streamName);
    // Publish to JetStream for guaranteed delivery
    const jsAck = await publishToJetStream(subjectName, msgData, jsc);
    this.logger.log(`[NATS] Message moved to DID stream: ${JSON.stringify(jsAck)}`);
  }
}
