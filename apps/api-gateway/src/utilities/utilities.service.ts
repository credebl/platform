import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';
import { Client as PgClient } from 'pg';

@Injectable()
export class UtilitiesService extends BaseService {
  private pg: PgClient;

  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('UtilitiesService');
    if ('true' === process.env.DB_ALERT_ENABLE?.trim()?.toLowerCase() && !process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    } else {
      this.pg = new PgClient({
        connectionString: process.env.DATABASE_URL
      });
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      if ('true' !== process.env.DB_ALERT_ENABLE?.trim()?.toLowerCase()) {
        // in case it is not enabled, return
        return;
      }
      await this.pg.connect();
      await this.pg.query('LISTEN ledger_null');
      this.logger.log('PostgreSQL notification listener connected');
    } catch (err) {
      this.logger.error(`Failed to connect PostgreSQL listener: ${err?.message}`);
      throw err;
    }

    this.pg.on('notification', async (msg) => {
      if ('true' !== process.env.DB_ALERT_ENABLE?.trim()?.toLocaleLowerCase()) {
        // in case it is not enabled, return
        return;
      }

      if ('ledger_null' === msg.channel) {
        try {
          // Step 1: Count total records
          const totalRes = await this.pg.query('SELECT COUNT(*) FROM org_agents');
          const total = Number(totalRes.rows[0].count);

          // Step 2: Count NULL ledgerId records
          const nullRes = await this.pg.query('SELECT COUNT(*) FROM org_agents WHERE "ledgerId" IS NULL');
          const nullCount = Number(nullRes.rows[0].count);

          // Step 3: Calculate %
          const percent = (nullCount / total) * 100;

          // Condition: > 30%
          if (30 >= percent) {
            return;
          }

          const alertEmails =
            process.env.DB_ALERT_EMAILS?.split(',')
              .map((e) => e.trim())
              .filter((e) => 0 < e.length) || [];

          if (0 === alertEmails.length) {
            this.logger.warn('DB_ALERT_EMAILS is empty, skipping alert');
            return;
          }

          // TODO: Check if the to email is actually this or we need to take it from DB
          if (!process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL) {
            this.logger.warn('PUBLIC_PLATFORM_SUPPORT_EMAIL not configured, skipping alert');
            return;
          }

          const emailDto = {
            emailFrom: process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL,
            emailTo: alertEmails,
            emailSubject: '[ALERT] More than 30% org_agents ledgerId is NULL',
            emailText: `ALERT: ${percent.toFixed(2)}% of org_agents records currently have ledgerId = NULL.`,
            emailHtml: `<p><strong>ALERT:</strong> ${percent.toFixed(
              2
            )}% of <code>org_agents</code> have <code>ledgerId</code> = NULL.</p>`
          };

          const result = await this.natsClient.sendNatsMessage(this.serviceProxy, 'alert-db-ledgerId-null', {
            emailDto
          });
          this.logger.debug('Received result', JSON.stringify(result, null, 2));
        } catch (err) {
          this.logger.error(err?.message ?? 'Error in ledgerId alert handler');
        }
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pg?.end();
  }

  async createShorteningUrl(shorteningUrlDto: UtilitiesDto): Promise<string> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-shortening-url', shorteningUrlDto);
  }

  async storeObject(persistent: boolean, storeObjectDto: StoreObjectDto): Promise<string> {
    const storeObj = storeObjectDto.data;
    const payload = { persistent, storeObj };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'store-object-return-url', payload);
  }
}
