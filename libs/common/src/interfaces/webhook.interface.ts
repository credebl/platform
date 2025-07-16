export interface IWebhookUrl {
  orgId?: string;
  tenantId?: string;
}

export interface ICreateWebhookUrl {
  webhookUrl: string;
}

export interface IGetWebhookUrl {
  webhookUrl: string;
}
