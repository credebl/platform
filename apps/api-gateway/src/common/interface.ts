export interface ResponseType {
  statusCode: number;
  message: string;
  data?: Record<string, unknown> | string;
  error?: Record<string, unknown> | string;
}

export interface ExceptionResponse {
  message: string | string[]
  error: string
  statusCode: number
}
