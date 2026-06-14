import { Prisma } from '@prisma/client';

export interface IRestrictedUserSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  clientInfo: Prisma.JsonValue | null;
  sessionType: string;
}

export interface ISessionData {
  sessionId: string;
}

export interface ISessionDetails extends ISession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession {
  id?: string;
  sessionToken?: string;
  userId?: string;
  expires?: number;
  refreshToken?: string;
  keycloakUserId?: string;
  type?: string;
  accountId?: string;
  sessionType?: string;
  expiresAt?: Date;
  clientInfo?: Prisma.JsonValue | null;
}
