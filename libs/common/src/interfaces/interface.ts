export interface ResponseType {
    statusCode: number;
    message: string;
    data?: Record<string, unknown> | string;
    error?: Record<string, unknown> | string;
  }

export interface IAccessTokenData {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}  