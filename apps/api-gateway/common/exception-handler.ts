import { ResponseMessages } from '@credebl/common/response-messages'
import { type ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import type { ExceptionResponse } from './interface'

@Catch()
export class CustomExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger()
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    let errorResponse: { statusCode: HttpStatus; message: string | string[]; error: string }
    let status = HttpStatus.INTERNAL_SERVER_ERROR

    if (!exception || JSON.stringify(exception) === '{}') {
      errorResponse = {
        statusCode: status,
        message: 'Something went wrong!',
        error: ResponseMessages.errorMessages.serverError,
      }
    }
    if (exception instanceof HttpException) {
      status = exception.getStatus()
    }

    let exceptionResponse: ExceptionResponse = {} as ExceptionResponse
    const exceptionResponseData = exception.getResponse ? exception.getResponse() : exception

    if (typeof exceptionResponseData === 'string') {
      exceptionResponse.message = exceptionResponseData
    } else {
      exceptionResponse = exceptionResponseData as unknown as ExceptionResponse
    }

    if (exceptionResponse.message?.includes(ResponseMessages.nats.error.noSubscribers)) {
      exceptionResponse.message = ResponseMessages.nats.error.noSubscribers
    }
    errorResponse = {
      statusCode: exceptionResponse.statusCode ? exceptionResponse.statusCode : status,
      message: exceptionResponse.message ? exceptionResponse.message : 'Something went wrong!',
      error: exceptionResponse.error ? exceptionResponse.error : ResponseMessages.errorMessages.serverError,
    }
    response.status(errorResponse.statusCode).json(errorResponse)
  }
}
