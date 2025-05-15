import type { NATSClient } from '@credebl/common/NATSClient'
/* eslint-disable camelcase */
import { Inject, Injectable } from '@nestjs/common'
import type { ClientProxy } from '@nestjs/microservices'
import type { ICreateWebhookUrl, IGetWebhookUrl } from 'apps/webhook/interfaces/webhook.interfaces'
import { BaseService } from 'libs/service/base.service'
import type { GetWebhookDto } from './dtos/get-webhoook-dto'
import type { RegisterWebhookDto } from './dtos/register-webhook-dto'

@Injectable()
export class WebhookService extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly webhookProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('WebhookService')
  }

  async getWebhookUrl(getWebhook: GetWebhookDto): Promise<IGetWebhookUrl> {
    // NATS call
    return this.natsClient.sendNatsMessage(this.webhookProxy, 'get-webhookurl', getWebhook)
  }

  async registerWebhook(registerWebhookDto: RegisterWebhookDto): Promise<ICreateWebhookUrl> {
    const payload = { registerWebhookDto }

    // NATS call
    return this.natsClient.sendNatsMessage(this.webhookProxy, 'register-webhook', payload)
  }
}
