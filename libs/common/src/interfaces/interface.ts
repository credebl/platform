export interface ResponseType {
    statusCode: number;
    message: string;
    data?: Record<string, unknown> | string;
    error?: Record<string, unknown> | string;
  }
  