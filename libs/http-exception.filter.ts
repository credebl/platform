import { ResponseMessages } from '@credebl/common/response-messages';
import { Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('CommonService');

  catch(exception: unknown): Observable<never> {
    this.logger.error(`AnyExceptionFilter caught error: ${JSON.stringify(exception)}`);
    const { httpStatus, message, error } = this.getExceptionDetails(exception);
    return throwError(() => new RpcException({ message, statusCode: httpStatus, error }));
  }

  private getExceptionDetails(exception): { httpStatus: number, message: string, error: string } {
    switch (exception.error.name) {
      case 'HttpException':
        return this.handleHttpException(exception);
      case 'RpcException':
        return this.handleRpcException(exception);
      case 'PrismaClientKnownRequestError':
        return this.handlePrismaClientKnownRequestError(exception);
      case 'PrismaClientValidationError':
        return this.handlePrismaClientValidationError(exception);
      default:
        return this.handleUnknownException(exception);
    }
  }

  private handleHttpException(exception): { httpStatus: number, message: string, error: string } {
    this.logger.error(`It's HttpException`);
    const httpStatus = exception.getStatus() || HttpStatus.BAD_REQUEST;
    const message = exception?.getResponse() || exception.message;
    return { httpStatus, message, error: ResponseMessages.errorMessages.serverError };
  }

  private handleRpcException(exception): never {
    this.logger.error(`It's RpcException`);
    throw exception.getError();
  }

  private handlePrismaClientKnownRequestError(exception): { httpStatus: number, message: string, error: string } {
    this.logger.error(`It's PrismaClientKnownRequestError`);
    const errorCode = exception.error.code;
    const message = exception?.error?.meta?.message ?? exception?.error?.meta?.cause ?? exception?.message;

    switch (errorCode) {
      case 'P2002': // Unique constraint failed on the {constraint}
      case 'P2010': // Raw query failed. Code: {code}. Message: {message}
      case 'P2011': // Null constraint violation on the {constraint}
        return { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message, error: ResponseMessages.errorMessages.serverError };
      case 'P2000': // The provided value for the column is too long for the column's type. Column: {column_name}
      case 'P2005': // The value {field_value} stored in the database for the field {field_name} is invalid for the field's type
      case 'P2006': // The provided value {field_value} for {model_name} field {field_name} is not valid
      case 'P2017': // The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected.
        return { httpStatus: HttpStatus.CONFLICT, message, error: ResponseMessages.errorMessages.conflict };
      case 'P2001': // The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist
      case 'P2015': // A related record could not be found. {details}
      case 'P2018': // The required connected records were not found. {details}
      case 'P2025': // An operation failed because it depends on one or more records that were required but not found. {cause}
        return { httpStatus: HttpStatus.NOT_FOUND, message, error: ResponseMessages.errorMessages.notFound };
      case 'P2021': // The table {table} does not exist in the current database.
      case 'P2022': // The column {column} does not exist in the current database.
      case 'P2023': // Inconsistent column data: {message}
        return { httpStatus: HttpStatus.BAD_REQUEST, message, error: ResponseMessages.errorMessages.badRequest };
      default:
        return { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message, error: ResponseMessages.errorMessages.serverError };
    }
  }

  private handlePrismaClientValidationError(exception): { httpStatus: number, message: string, error: string } {
    this.logger.error(`It's PrismaClientValidationError`);
    const httpStatus = HttpStatus.BAD_REQUEST;
    const message = exception?.meta?.message ?? exception?.error?.meta?.cause ?? exception?.message ?? exception?.response?.message;
    return { httpStatus, message, error: ResponseMessages.errorMessages.badRequest };
  }

  private handleUnknownException(exception): { httpStatus: number, message: string, error: string } {
    this.logger.error(`It's an Unknown Exception`);
    const httpStatus =
      exception.response?.status ??
      exception.response?.statusCode ??
      exception?.error?.meta?.cause ??
      exception.code ?? 
      exception.error.statusCode ??
      HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception.response?.data?.message ??
      exception.response?.message ??
      exception?.error?.meta?.cause ??
      exception?.error?.message ??
      exception?.message ??
      'Internal server error';
    const error =
    exception?.error?.error ??
    ResponseMessages.errorMessages.serverError;
    return { httpStatus, message, error };
  }
}
