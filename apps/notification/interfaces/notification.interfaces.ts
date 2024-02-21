

export interface INotification {
    id: string;
    orgId: string;
    notificationWebhook: string;
}

export interface IWebhookEndpoint {
    orgId: string;
    notificationWebhook: string;
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