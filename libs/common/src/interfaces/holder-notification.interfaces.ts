import { NotificationStatus } from '@credebl/enum/enum';

export interface IHolderNotification {
  id: string;
  sessionId: string;
  holderDid: string;
  fcmToken: string;
  state: string;
  createDateTime: Date;
  lastChangedDateTime: Date;
  deletedAt?: Date;
}

export interface ICreateHolderNotification {
  sessionId: string;
  holderDid: string;
  fcmToken: string;
  state: NotificationStatus;
}

export interface IWebhookEndpoint {
  orgId: string;
  notificationWebhook: string;
}
