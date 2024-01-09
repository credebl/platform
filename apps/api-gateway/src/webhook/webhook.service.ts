/* eslint-disable camelcase */
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { RegisterWebhookDto } from './dtos/register-webhook-dto';
import { ICreateWebhookUrl, IGetWebhookUrl } from 'apps/webhook/interfaces/webhook.interfaces';

@Injectable()
export class WebhookService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly webhookProxy: ClientProxy) {
    super('WebhookService');
  }

  async getWebhookUrl(tenantId: string): Promise<IGetWebhookUrl> {
    const payload = { tenantId };

    // NATS call
    return this.sendNatsMessage(this.webhookProxy, 'get-webhookurl', payload);
  }

  async registerWebhook(registerWebhookDto: RegisterWebhookDto): Promise<ICreateWebhookUrl> {
    const payload = { registerWebhookDto};

    // NATS call
    return this.sendNatsMessage(this.webhookProxy, 'register-webhook', payload);
  }

  
}
