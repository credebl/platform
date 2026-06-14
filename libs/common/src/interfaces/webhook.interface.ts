export interface ICreateWebhookUrl {
  webhookUrl: string;
  webhookSecret?: string;
}

export interface IGetWebhookUrl {
  webhookUrl: string;
  webhookSecret?: string;
}

export interface IWebhookUrl {
  orgId?: string;
  tenantId?: string;
}

export interface IWebhookUrlInfo {
  webhookUrl: string;
  webhookSecret: string | null;
}
