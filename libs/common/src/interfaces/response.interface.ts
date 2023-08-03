export default interface IResponseType {
  statusCode: number;
  message?: string;
  data?: unknown;
  error?: unknown;
};
