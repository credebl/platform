/* eslint-disable camelcase */
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';
import { RegisterWebhookDto } from './dtos/register-webhook-dto';
import { ICreateWebhookUrl, IGetWebhookUrl } from 'apps/webhook/interfaces/webhook.interfaces';
import { GetWebhookDto } from './dtos/get-webhoook-dto';

@Injectable()
export class WebhookService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly webhookProxy: ClientProxy) {
    super('WebhookService');
  }

  async getWebhookUrl(getWebhook: GetWebhookDto): Promise<IGetWebhookUrl> { 
    // NATS call
    return this.sendNatsMessage(this.webhookProxy, 'get-webhookurl', getWebhook);
  }

  async registerWebhook(registerWebhookDto: RegisterWebhookDto): Promise<ICreateWebhookUrl> {
    const payload = { registerWebhookDto};

    // NATS call
    return this.sendNatsMessage(this.webhookProxy, 'register-webhook', payload);
  }

  
}
