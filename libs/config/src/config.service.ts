import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get isProduction(): boolean {
    return 'production' === this.environment;
  }

  get isDevelopment(): boolean {
    return 'development' === this.environment;
  }

  get isTest(): boolean {
    return 'test' === this.environment;
  }

  get slackWebhookUrl(): string {
    return this.configService.get<string>('SLACK_INC_WEBHOOK_URL');
  }

  private get environment(): string {
    return this.configService.get<string>('NODE_ENV');
  }
}
