/* eslint-disable camelcase */
import { Logger } from '@nestjs/common';
import {
  AckPolicy,
  DeliverPolicy,
  JetStreamClient,
  JetStreamManager,
  ReplayPolicy,
  RetentionPolicy,
  StorageType,
  nanos
} from 'nats';
import assert = require('node:assert');

export const SOURCE_STREAM = 'notify';
export const STREAM = 'aggregate';
export const DID_STREAM = 'did-notify';
export const SUBJECTS = ['aggregate.>'];
export const CONSUMER = 'hub-consumer';
export const PULL_CONSUMER = 'hub-pull-consumer';

const logger = new Logger('JetStreamSetup');
/**
 * Ensures the JetStream stream exists
 */
export async function ensureStream(jsm: JetStreamManager): Promise<void> {
  try {
    // await jsm.streams.delete(STREAM);
    await jsm.streams.info(STREAM);
    logger.log(`[NATS] Stream '${STREAM}' already exists`);
  } catch {
    logger.log(`[NATS] Creating stream '${STREAM}'`);
    await jsm.streams.add({
      name: STREAM,
      //subjects: SUBJECTS,
      retention: RetentionPolicy.Workqueue,
      storage: StorageType.File,
      sources: [
        { name: SOURCE_STREAM, domain: 'del' },
        { name: SOURCE_STREAM, domain: 'blr' }
      ]
    });
  }
}

export async function ensureDidStream(jsm: JetStreamManager): Promise<void> {
  try {
    // await jsm.streams.delete(DID_STREAM);
    await jsm.streams.info(DID_STREAM);
    logger.log(`[NATS] Stream '${DID_STREAM}' already exists`);
  } catch {
    logger.log(`[NATS] Creating stream '${DID_STREAM}'`);
    await jsm.streams.add({
      name: DID_STREAM,
      subjects: [`${DID_STREAM}.>`],
      retention: RetentionPolicy.Workqueue,
      storage: StorageType.File
    });
  }
}

/**
 * Ensures the JetStream consumer exists
 */
export async function ensureConsumer(jsm: JetStreamManager): Promise<void> {
  try {
    // await jsm.consumers.delete(STREAM, CONSUMER);
    // await jsm.consumers.update(STREAM, CONSUMER, {
    //  // eslint-disable-next-line camelcase
    // //  filter_subject: '*.presentation.test.blr'
    // });
    await jsm.consumers.info(STREAM, PULL_CONSUMER);
    logger.log(`[NATS] Consumer '${PULL_CONSUMER}' already exists`);
  } catch {
    logger.log(`[NATS] Creating consumer '${CONSUMER}'`);
    await jsm.consumers.add(STREAM, {
      name: PULL_CONSUMER,
      durable_name: PULL_CONSUMER,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      ack_wait: nanos(10_000),
      max_deliver: 4
      // ,filter_subjects: ['hubStream.presentation.test.*']
    });
  }
}

export async function ensureSessionConsumer(jsm: JetStreamManager, sessionId: string): Promise<string> {
  const consumerName = `notify-session-${sessionId}`;

  try {
    // await jsm.consumers.delete(STREAM, consumerName);
    await jsm.consumers.info(STREAM, consumerName);
    logger.log(`[NATS] Consumer '${consumerName}' already exists`);
    return consumerName;
  } catch (error) {
    logger.error(
      `Error creatingg consumer info for '${consumerName}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    logger.log(`[NATS] Creating consumer '${consumerName}'`);
    await jsm.consumers.add(STREAM, {
      name: consumerName,
      // durable_name: consumerName,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: `notify.*.*.*.${sessionId}`,
      replay_policy: ReplayPolicy.Instant,
      // max_ack_pending: 1000,
      inactive_threshold: 30_000
    });

    return consumerName;
  }
}

export async function ensureSessionConsumerWithDidStream(jsm: JetStreamManager, sessionId: string): Promise<string> {
  const consumerName = `notify-session-${sessionId}`;

  try {
    await jsm.consumers.info(DID_STREAM, consumerName);
    logger.log(`[NATS] Consumer '${consumerName}' already exists`);
    return consumerName;
  } catch (error) {
    logger.error(
      `Error creatingg consumer info for '${consumerName}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    logger.log(`[NATS] Creating consumer '${consumerName}'`);
    await jsm.consumers.add(DID_STREAM, {
      name: consumerName,
      // durable_name: consumerName,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: `notify.*.*.*.${sessionId}`,
      replay_policy: ReplayPolicy.Instant,
      // max_ack_pending: 1000,
      inactive_threshold: 30_000
    });

    return consumerName;
  }
}

export function assertDefined<T>(v: T, msg = 'Value must be defined'): asserts v is NonNullable<T> {
  assert(null !== v && v !== undefined, msg);
}

/**
 * Publish to JetStream with guaranteed delivery
 * Returns acknowledgment from JetStream with stream name and sequence number
 */
export async function publishToJetStream(
  subject: string,
  payload: unknown,
  jsc: JetStreamClient
  // options?: JetStreamPublishOptions,
): Promise<{ stream: string; seq: number }> {
  assertDefined(subject, 'Subject is required for publishing');
  assertDefined(payload, 'payload is required for publishing');

  try {
    // const js = await getJetStreamClient();
    logger.log(`------------Publishing to JetStream------------ ${subject} with payload: ${JSON.stringify(payload)}`);
    const ack = await jsc.publish(
      `${subject}`,
      // sc.encode(JSON.stringify(payload))
      JSON.stringify(payload)
    );

    logger.log(
      `[NATS] Message published to JetStream, ${JSON.stringify({
        subject,
        stream: ack.stream,
        sequence: ack.seq,
        dataSize: payload.length,
        duplicate: ack.duplicate || false
      })}`
    );

    return {
      stream: ack.stream,
      seq: ack.seq
    };
  } catch (error) {
    logger.error(`------------${JSON.stringify(error)}`);
    logger.error('[NATS] JetStream publish failed', {
      subject,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
