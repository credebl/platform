/* eslint-disable camelcase */
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from '@credebl/common';
import { RegisterWebhookDto } from './dtos/register-webhook-dto';
import { GetWebhookDto } from './dtos/get-webhoook-dto';
import { ICreateWebhookUrl, IGetWebhookUrl, NATSClient } from '@credebl/common';

@Injectable()
export class WebhookService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly webhookProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('WebhookService');
  }

  async getWebhookUrl(getWebhook: GetWebhookDto): Promise<IGetWebhookUrl> {
    // NATS call
    return this.natsClient.sendNatsMessage(this.webhookProxy, 'get-webhookurl', getWebhook);
  }

  async registerWebhook(registerWebhookDto: RegisterWebhookDto): Promise<ICreateWebhookUrl> {
    const payload = { registerWebhookDto };

    // NATS call
    return this.natsClient.sendNatsMessage(this.webhookProxy, 'register-webhook', payload);
  }
}
