/* eslint-disable camelcase */
import { Logger } from '@nestjs/common';
import { AckPolicy, DeliverPolicy, JetStreamClient, JetStreamManager, RetentionPolicy, StorageType, nanos } from 'nats';
import assert = require('node:assert');

export const AGGREGATE_STREAM = process.env.AGGREGATE_STREAM || 'aggregate';
export const DID_STREAM = process.env.DID_STREAM || 'did-notify';
export const PULL_CONSUMER = process.env.PULL_CONSUMER || 'hub-pull-consumer';
const logger = new Logger('JetStreamSetup');
/**
 * Ensures the JetStream stream exists
 */
export async function ensureStream(jsm: JetStreamManager): Promise<void> {
  try {
    await jsm.streams.info(AGGREGATE_STREAM);
    logger.log(`[NATS] Stream '${AGGREGATE_STREAM}' already exists`);
  } catch (error) {
    logger.error(
      `[NATS] Error checking stream '${AGGREGATE_STREAM}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    logger.log(`[NATS] Creating stream '${AGGREGATE_STREAM}'`);
    await jsm.streams.add({
      name: AGGREGATE_STREAM,
      //subjects: SUBJECTS,
      retention: RetentionPolicy.Workqueue,
      storage: StorageType.File,
      sources: []
    });
  }
}

export async function ensureDidStream(jsm: JetStreamManager): Promise<void> {
  try {
    await jsm.streams.info(DID_STREAM);
    logger.log(`[NATS] Stream '${DID_STREAM}' already exists`);
  } catch (error) {
    logger.error(
      `[NATS] Error checking stream '${DID_STREAM}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
    await jsm.consumers.info(AGGREGATE_STREAM, PULL_CONSUMER);
    logger.log(`[NATS] Consumer '${PULL_CONSUMER}' already exists`);
  } catch (error) {
    logger.error(
      `[NATS] Error checking consumer '${PULL_CONSUMER}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    logger.log(`[NATS] Creating consumer '${PULL_CONSUMER}'`);
    await jsm.consumers.add(AGGREGATE_STREAM, {
      name: PULL_CONSUMER,
      durable_name: PULL_CONSUMER,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      ack_wait: process.env.CONSUMER_CONFIG_ACK_WAIT
        ? nanos(Number(process.env.CONSUMER_CONFIG_ACK_WAIT))
        : nanos(10_000),
      max_deliver: process.env.CONSUMER_CONFIG_MAX_DELIVER ? Number(process.env.CONSUMER_CONFIG_MAX_DELIVER) : 4
    });
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
    logger.log(`[NATS] Publishing to JetStream: ${subject}`);
    logger.debug(`[NATS] Payload for ${subject}:`, { payload }); // Only in debug mode
    const ack = await jsc.publish(
      `${subject}`,
      // sc.encode(JSON.stringify(payload))
      JSON.stringify(payload)
    );

    logger.log(
      `[NATS] Message published to JetStream - ${JSON.stringify({
        subject,
        stream: ack.stream,
        sequence: ack.seq,
        duplicate: ack.duplicate || false
      })}`
    );

    return {
      stream: ack.stream,
      seq: ack.seq
    };
  } catch (error) {
    logger.error(`[NATS] Error publishing to JetStream: ${JSON.stringify(error)}`);
    logger.error('[NATS] JetStream publish failed', {
      subject,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
