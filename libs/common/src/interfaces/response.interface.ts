export interface IResponse {
  statusCode: number;
  message: string;
  label?: string;
  data?: unknown;
};

export default interface IResponseType {
  statusCode: number;
  message?: string;
  label?: string;
  data?: unknown;
  error?: unknown;
// eslint-disable-next-line semi
}
