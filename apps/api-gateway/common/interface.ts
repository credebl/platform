import { Prisma } from '@prisma/client';

export interface ResponseType {
  statusCode: number;
  message: string;
  data?: Record<string, unknown> | string;
  error?: Record<string, unknown> | string;
}

export interface ExceptionResponse {
  message: string | string[];
  error: string;
  statusCode: number;
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
