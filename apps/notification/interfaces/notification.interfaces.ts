

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
    messageType: string;
    clientCode: string;
}

export interface IGetNotification {
    fcmToken: string;
    messageType: string;
}