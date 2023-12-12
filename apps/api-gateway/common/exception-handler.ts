import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { isArray } from 'class-validator';

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
    if (isArray(exception)) {
      errorResponse = {
        statusCode: status,
        message: exception[0],
        error: exception[0]
      };
    } else if (exception && exception['statusCode'] === HttpStatus.INTERNAL_SERVER_ERROR) {
      if (exception.message && exception.message['message']) {
        errorResponse = {
          statusCode: status,
          message: exception.message['message'],
          error: exception.message['message']
        };
      } else {
        errorResponse = {
          statusCode: status,
          message: 'Oops! Something went wrong. Please try again',
          error: 'Oops! Something went wrong. Please try again'
        };
      }
    } else if (
      exception &&
      exception['error'] &&
      exception['error'].message &&
      (exception['error'].statusCode || exception['error'].code)
    ) {
      const statusCode = exception['error'].statusCode || exception['error'].code || status;
      errorResponse = {
        statusCode,
        message: exception['error'].message || 'Internal server error',
        error: exception['error'].message || 'Internal server error'
      };
    } else if (exception && exception['statusCode'] === undefined && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse = {
        statusCode: status,
        message: 'Oops! Something went wrong. Please try again',
        error: 'Oops! Something went wrong. Please try again'
      };
    } else {
      if (exception && exception['response'] && exception.message) {
        if (Array.isArray(exception['response'].message)) {
          errorResponse = {
            statusCode: exception['statusCode'] ? exception['statusCode'] : status,
            message: exception.message ? exception.message : 'Internal server error',
            error: exception['response'].message
              ? exception['response'].message
              : exception['response']
              ? exception['response']
              : 'Internal server error'
          };
        } else {
          errorResponse = {
            statusCode: exception['statusCode'] ? exception['statusCode'] : status,
            message: exception['response'].message
              ? exception['response'].message
              : exception['response']
              ? exception['response']
              : 'Internal server error',
            error: exception['response'].message
              ? exception['response'].message
              : exception['response']
              ? exception['response']
              : 'Internal server error'
          };
        }
      } else if (exception && exception.message) {
        errorResponse = {
          statusCode: exception['statusCode'] ? exception['statusCode'] : status,
          message: exception.message || 'Internal server error',
          error: exception.message || 'Internal server error'
        };
      }
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}