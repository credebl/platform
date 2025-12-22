import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto';
import { CreateIntentTemplateDto, UpdateIntentTemplateDto } from './dtos/intent-template.dto';
import { GetAllIntentTemplatesDto } from './dtos/get-all-intent-templates.dto';
import { NATSClient } from '@credebl/common/NATSClient';
import { ClientProxy } from '@nestjs/microservices';
import { Client as PgClient } from 'pg';
import { CommonConstants } from '@credebl/common/common.constant';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';

@Injectable()
export class UtilitiesService extends BaseService {
  private readonly pg: PgClient;
  private isSendingNatsAlert = false;

  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('UtilitiesService');
    if ('true' === process.env.DB_ALERT_ENABLE?.trim()?.toLowerCase()) {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      } else {
        this.pg = new PgClient({
          connectionString: process.env.DATABASE_URL
        });
      }
    }
  }

  // TODO: I think it would be better, if we add all the event listening and email sending logic in a common library instead of it being scattered across here and the utility microservice
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
      if ('true' !== process.env.DB_ALERT_ENABLE?.trim()?.toLowerCase()) {
        // in case it is not enabled, return
        return;
      }

      if ('ledger_null' === msg.channel) {
        try {
          if (this.isSendingNatsAlert) {
            this.logger.warn('Skipping duplicate NATS alert send...');
            return;
          }

          this.isSendingNatsAlert = true;

          // Step 1: Count total records
          const totalRes = await this.pg.query('SELECT COUNT(*) FROM org_agents');
          const total = Number(totalRes.rows[0].count);

          // If the org_agents table has no records, total will be 0, causing a division by zero resulting in Infinity or NaN
          if (0 === total) {
            this.logger.debug('No org_agents records found, skipping alert check');
            return;
          }

          // Step 2: Count NULL ledgerId records
          const nullRes = await this.pg.query('SELECT COUNT(*) FROM org_agents WHERE "ledgerId" IS NULL');
          const nullCount = Number(nullRes.rows[0].count);

          // Step 3: Calculate %
          const percent = (nullCount / total) * 100;

          // Condition: > 30% for now
          if (CommonConstants.AFFECTED_RECORDS_THRESHOLD_PERCENTAGE_FOR_DB_ALERT >= percent) {
            return;
          }

          const alertEmails =
            process.env.DB_ALERT_EMAILS?.split(',')
              .map((e) => e.trim())
              .filter((e) => 0 < e.length) || [];

          if (0 === alertEmails.length) {
            this.logger.error(
              `DB_ALERT_EMAILS is empty, skipping alert. There is a ${percent}% records are set to null for 'ledgerId' in 'org_agents' table`,
              'DB alert'
            );
            return;
          }

          const emailDto = {
            emailFrom: '',
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
        } finally {
          // Once its done, reset the flag
          this.isSendingNatsAlert = false;
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

  // Intent Template CRUD operations
  async createIntentTemplate(createIntentTemplateDto: CreateIntentTemplateDto, user: IUserRequest): Promise<object> {
    const payload = { ...createIntentTemplateDto, user };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-intent-template', payload);
  }

  async getIntentTemplateById(id: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-template-by-id', id);
  }

  async getIntentTemplatesByIntentId(intentId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-templates-by-intent-id', intentId);
  }

  async getIntentTemplatesByOrgId(orgId: string): Promise<object[]> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-templates-by-org-id', orgId);
  }

  async getAllIntentTemplatesByQuery(
    intentTemplateSearchCriteria: GetAllIntentTemplatesDto
  ): Promise<IIntentTemplateList> {
    const payload = {
      intentTemplateSearchCriteria
    };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-all-intent-templates-by-query', payload);
  }

  async getIntentTemplateByIntentAndOrg(intentName: string, verifierOrgId: string): Promise<object | null> {
    const payload = { intentName, verifierOrgId };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-intent-template-by-intent-and-org', payload);
  }

  async updateIntentTemplate(
    id: string,
    updateIntentTemplateDto: UpdateIntentTemplateDto,
    user: IUserRequest
  ): Promise<object> {
    const payload = { id, ...updateIntentTemplateDto, user };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'update-intent-template', payload);
  }

  async deleteIntentTemplate(id: string): Promise<object> {
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'delete-intent-template', id);
  }
}
