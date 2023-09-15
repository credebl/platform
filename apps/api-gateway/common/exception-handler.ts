import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class CustomExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }

    if ("Cannot read properties of undefined (reading 'response')" === exception.message) {
      exception.message = 'Oops! Something went wrong. Please try again';
    }
    
    let errorResponse;
    if (exception && exception["statusCode"] === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse = {
        statusCode: status,
        message: 'Oops! Something went wrong. Please try again',
        error: 'Oops! Something went wrong. Please try again'
      };
    } else if (exception["statusCode"] === undefined && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse = {
        statusCode: status,
        message: 'Oops! Something went wrong. Please try again',
        error: 'Oops! Something went wrong. Please try again'
      };
    } else {
      errorResponse = {
        statusCode: exception["statusCode"] ? exception["statusCode"] : status,
        message: exception.message || 'Internal server error',
        error: exception.message
      };
    }

    response.status(status).json(errorResponse);
  }
}