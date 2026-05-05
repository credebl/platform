export interface ICreateWebhookUrl {
  webhookUrl: string;
  webhookSecret?: string;
}

export interface IGetWebhookUrl {
  webhookUrl: string;
  webhookSecret?: string;
}

export interface IWebhookDto {
  orgId: string;
  webhookUrl: string;
  webhookSecret?: string;
}
