/* eslint-disable camelcase */
import { Logger } from '@nestjs/common';
import { AckPolicy, DeliverPolicy, JetStreamManager, ReplayPolicy, RetentionPolicy, StorageType, nanos } from 'nats';

export const SOURCE_STREAM = 'notify';
export const STREAM = 'aggregate';
export const SUBJECTS = ['aggregate.>'];
export const CONSUMER = 'hub-consumer';

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
    await jsm.consumers.info(STREAM, CONSUMER);
    logger.log(`[NATS] Consumer '${CONSUMER}' already exists`);
  } catch {
    logger.log(`[NATS] Creating consumer '${CONSUMER}'`);
    await jsm.consumers.add(STREAM, {
      name: CONSUMER,
      durable_name: CONSUMER,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      ack_wait: nanos(30_000),
      max_deliver: 5
      // ,filter_subjects: ['hubStream.presentation.test.*']
    });
  }
}

export async function ensureSessionConsumer(jsm: JetStreamManager, sessionId: string): Promise<string> {
  const consumerName = `notify-session-${sessionId}`;

  try {
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
      max_ack_pending: 1000,
      inactive_threshold: 30_000
    });

    return consumerName;
  }
}
