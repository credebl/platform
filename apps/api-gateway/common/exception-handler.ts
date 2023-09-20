import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class CustomExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger();
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }

    this.logger.error(`exception ::: ${JSON.stringify(exception)}`);
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
    } else if (exception && exception["statusCode"] === undefined && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse = {
        statusCode: status,
        message: 'Oops! Something went wrong. Please try again',
        error: 'Oops! Something went wrong. Please try again'
      };
    } else {
      if (exception && exception["response"] && exception.message) {

        if (Array.isArray(exception["response"].message)) {
          exception["response"].message.forEach((msg) => {
            errorResponse = {
              statusCode: exception["statusCode"] ? exception["statusCode"] : status,
              message: msg || 'Internal server error',
              error: msg || 'Internal server error'
            };
          });
        } else {
          errorResponse = {
            statusCode: exception["statusCode"] ? exception["statusCode"] : status,
            message: exception["response"].message ? exception["response"].message : exception["response"] ? exception["response"] : 'Internal server error',
            error: exception["response"].message ? exception["response"].message : exception["response"] ? exception["response"] : 'Internal server error'
          };
        }
      } else if (exception && exception.message) {

        errorResponse = {
          statusCode: exception["statusCode"] ? exception["statusCode"] : status,
          message: exception.message || 'Internal server error',
          error: exception.message || 'Internal server error'
        };

      }
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}