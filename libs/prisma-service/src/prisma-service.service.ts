/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmailService } from '@credebl/common/email.service';
import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Client as PgClient } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('PrismaService');
  private prismaLogs: string[];
  private pg: PgClient;
  private lastAlertTime: number | null = null;
  private readonly emailService = new EmailService();

  private enable = (type: string): boolean => this.prismaLogs.includes(type);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' }
      ]
    });

    this.prismaLogs = String(process.env.PRISMA_LOGS || '')
      .toLowerCase()
      .split(',')
      .map((l) => l.trim());

    this.pg = new PgClient({
      connectionString: process.env.DATABASE_URL
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (this.enable('error')) {
      (this as any).$on('error', (e: Prisma.LogEvent) => {
        this.logger.error(JSON.stringify(e.message, null, 2), '', '(Prisma Error) Message:');
        this.logger.error(e.target, '', '(Prisma Error) Target:');
        this.logger.error(`${e.timestamp}ms`, '', '(Prisma Error) Timestamp:');
      });
    }
    if (this.enable('warn')) {
      (this as any).$on('warn', (e: Prisma.LogEvent) => {
        this.logger.warn(JSON.stringify(e.message, null, 2), '(Prisma Warn) Message:');
        this.logger.warn(e.target, '(Prisma Warn) Target:');
        this.logger.warn(`${e.timestamp}ms`, '(Prisma Warn) Timestamp:');
      });
    }
    if (this.enable('query')) {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        this.logger.debug(JSON.stringify(e.query, null, 2), '(Prisma Query) Query:');
        this.logger.debug(e.target, '(Prisma Query) Target:');
        this.logger.debug(`${e.timestamp}ms`, '(Prisma Query) Timestamp:');
      });
    }

    await this.pg.connect();

    this.pg.on('notification', async (msg) => {
      if ('ledger_null' === msg.channel) {
        await this.handleLedgerAlert();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enableShutdownHooks(app: INestApplication): Promise<void> {}

  async onModuleDestroy(): Promise<void> {
    await this.pg?.end();
  }

  private async handleLedgerAlert(): Promise<void> {
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

    // Avoid spamming: send only once every 2 hours
    const now = Date.now();
    if (this.lastAlertTime && now - this.lastAlertTime < 2 * 60 * 60 * 1000) {
      return;
    }
    this.lastAlertTime = now;

    const alertEmails =
      process.env.DB_ALERT_EMAILS?.split(',')
        .map((e) => e.trim())
        .filter((e) => 0 < e.length) || [];

    // Step 4: Send Email
    await this.emailService.sendEmail({
      emailFrom: process.env.PUBLIC_PLATFORM_SUPPORT_EMAIL,
      emailTo: alertEmails,
      emailSubject: '[ALERT] More than 30% org_agents ledgerId is NULL',
      emailText: `ALERT: ${percent.toFixed(2)}% of org_agents records currently have ledgerId = NULL.`,
      emailHtml: `<p><strong>ALERT:</strong> ${percent.toFixed(
        2
      )}% of <code>org_agents</code> have <code>ledgerId</code> = NULL.</p>`
    });

    this.logger.log('ALERT EMAIL SENT, ledgerId WAS SET TO NULL');
  }
}
