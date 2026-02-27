export interface IWebhookUrl {
  orgId?: string;
  tenantId?: string;
}

export interface IWebhookUrlInfo {
  webhookUrl: string;
  webhookSecret: string | null;
}
