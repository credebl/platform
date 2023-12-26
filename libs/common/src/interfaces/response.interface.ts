export default interface IResponseType {
  statusCode: number;
  message?: string;
  label?: string;
  data?: unknown;
  error?: unknown;
};

export default interface IResponse {
  statusCode: number;
  message?: string;
  label?: string;
  data?: unknown;
};

