import { DevelopmentEnvironment } from '@credebl/enum/enum';
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get isProduction(): boolean {
    return DevelopmentEnvironment.PRODUCTION === this.environment;
  }

  get isDevelopment(): boolean {
    return DevelopmentEnvironment.DEVELOPMENT === this.environment;
  }

  get isTest(): boolean {
    return DevelopmentEnvironment.TEST === this.environment;
  }

  get slackWebhookUrl(): string {
    return this.configService.get<string>('SLACK_INC_WEBHOOK_URL');
  }

  private get environment(): string {
    return this.configService.get<string>('NODE_ENV');
  }
}
