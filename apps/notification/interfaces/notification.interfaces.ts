

export interface IHolderRegisterCredentals {
    fcmToken: string;
    orgId: string;
    userKey: string;
  }

export interface INotification {
    id: string;
    orgId: string;
    webhookEndpoint: string;
}

export interface IWebhookEndpoint {
    orgId: string;
    webhookEndpoint: string;
}

export interface ISendNotification {
    fcmToken: string;
    '@type': string;
    clientCode: string;
}