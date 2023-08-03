import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  HttpAdapterHost
} from '@nestjs/common';
import { ResponseType } from './interface';

interface CustomException {
  message: string;
  error?: string;
  // Add other properties if needed
}
@Catch()
export class ExceptionHandler implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: CustomException, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      exception.message['error'] ||
      exception.message ||
      'Something went wrong!';

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();

      statusCode = exception.getStatus();
      message = errorResponse['error'] || message;
    }

    const responseBody: ResponseType = {
      statusCode,
      message,
      error: exception.message
    };

    httpAdapter.reply(response, responseBody, statusCode);
  }
}
