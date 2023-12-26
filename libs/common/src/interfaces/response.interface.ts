export default interface IResponseType {
  statusCode: number;
  message?: string;
  label?: string;
  data?: unknown;
  error?: unknown;
};
export interface IResponse {
  statusCode: number;
  message: string;
  label?: string;
  data?: unknown;
};
