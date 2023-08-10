import { Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { Observable, throwError } from 'rxjs';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('CommonService');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  catch(exception: any): Observable<any> {
    this.logger.error(`AnyExceptionFilter caught error: ${JSON.stringify(exception)}`);

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '';
    switch (exception.constructor) {
      case HttpException:
        this.logger.error(`Its HttpException`);
        httpStatus = exception.getStatus() || HttpStatus.BAD_REQUEST;
        message = exception?.getResponse() || exception.message;
        break;
      case RpcException:
        this.logger.error(`Its RpcException`);
        return throwError(() => exception.getError());
        break;
      case PrismaClientKnownRequestError:
        this.logger.error(`Its PrismaClientKnownRequestError`);
        switch (exception.code) {
          case 'P2002': // Unique constraint failed on the {constraint}
          case 'P2000': // The provided value for the column is too long for the column's type. Column: {column_name}
          case 'P2001': // The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist
          case 'P2005': // The value {field_value} stored in the database for the field {field_name} is invalid for the field's type
          case 'P2006': // The provided value {field_value} for {model_name} field {field_name} is not valid
          case 'P2010': // Raw query failed. Code: {code}. Message: {message}
          case 'P2011': // Null constraint violation on the {constraint}
          case 'P2017': // The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected.
          case 'P2021': // The table {table} does not exist in the current database.
          case 'P2022': // The column {column} does not exist in the current database.          
            httpStatus = HttpStatus.BAD_REQUEST;
            message = exception?.response?.message || exception?.message;
            break;
          case 'P2018': // The required connected records were not found. {details}
          case 'P2025': // An operation failed because it depends on one or more records that were required but not found. {cause}
          case 'P2015': // A related record could not be found. {details}
            httpStatus = HttpStatus.NOT_FOUND;
            message = exception?.message;
            break;
          default:
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception?.response?.message || exception?.message || 'Internal server error';
        }
        break;
      case PrismaClientValidationError:
        this.logger.error(`Its PrismaClientValidationError`);
        httpStatus = HttpStatus.BAD_REQUEST;
        message = exception?.message || exception?.response?.message;
        break;
      default:
        this.logger.error(`Its an Unknown Exception`);
        // eslint-disable-next-line no-case-declarations
        httpStatus =
          exception.response?.status ||
          exception.response?.statusCode ||
          exception.code ||
          HttpStatus.INTERNAL_SERVER_ERROR;
        // eslint-disable-next-line no-case-declarations
        message =
          exception.response?.data?.message ||
          exception.response?.message ||
          exception?.message ||
          'Internal server error';
    }
    return throwError(() => new RpcException({ message, code: httpStatus }));
  }
}