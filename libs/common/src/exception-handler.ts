import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  RpcExceptionFilter
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  // Add explicit types for 'exception' and 'host'
  catch(exception: any, host: ArgumentsHost): void {

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let httpStatus = exception.status; //HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '';

    switch (exception.constructor) {
      case HttpException:

        httpStatus = (exception as HttpException).getStatus();

        message = exception?.response?.error || exception?.message || 'Internal server error';
        break;
      case RpcException:
        httpStatus = exception?.code || exception?.error?.code || HttpStatus.BAD_REQUEST;
        message = exception?.response.error;
        break;
      default:
        httpStatus =
          exception.response?.status ||
          exception.response?.statusCode ||
          exception.code ||
          HttpStatus.INTERNAL_SERVER_ERROR;
        message =
          exception.response?.data?.message ||
          exception.response?.message ||
          exception?.message ||
          'Internal server error';

    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      error: exception.message
    };

    const data = httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);

  }
}

@Catch(RpcException)
export class CustomExceptionFilter implements RpcExceptionFilter<RpcException> {
  // Add explicit types for 'exception' and 'host'
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => new RpcException({ message: exception.getError(), code: HttpStatus.BAD_REQUEST }));
  }
}
