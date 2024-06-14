import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ExceptionResponse } from './interface';
import { ResponseMessages } from '@credebl/common/response-messages';

@Catch()
export class CustomExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger();
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    let errorResponse;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    
    this.logger.error(`exception ::: ${JSON.stringify(exception)}`);

    if (!exception || '{}' === JSON.stringify(exception)) {
      errorResponse = {
        statusCode: status,
        message: 'Something went wrong!',
        error: ResponseMessages.errorMessages.serverError
      };
    }
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }

    let exceptionResponse: ExceptionResponse;

    if (exception['response']) {
      exceptionResponse = exception['response'];
    } else {
      exceptionResponse = exception as unknown as ExceptionResponse;
    }

    errorResponse = {
      statusCode: exceptionResponse.statusCode ? exceptionResponse.statusCode : status,
      message: exceptionResponse.message
        ? exceptionResponse.message
        : 'Something went wrong!',
      error: exceptionResponse.error
        ? exceptionResponse.error
        : ResponseMessages.errorMessages.serverError
    };

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}