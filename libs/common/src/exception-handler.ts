import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  type RpcExceptionFilter,
} from '@nestjs/common'
import type { HttpAdapterHost } from '@nestjs/core'
import { RpcException } from '@nestjs/microservices'
import { type Observable, throwError } from 'rxjs'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('CommonService')
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  // Add explicit types for 'exception' and 'host'
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>, @typescript-eslint/explicit-module-boundary-types
  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    let message = ''
    this.logger.error(`AllExceptionsFilter caught error: ${JSON.stringify(exception)}`)
    switch (exception.constructor) {
      case HttpException:
        this.logger.error('Its HttpException')
        httpStatus = (exception as HttpException).getStatus()
        message = exception?.response?.error || exception?.message || 'Internal server error'
        break
      case RpcException:
        this.logger.error('Its RpcException')
        httpStatus = exception?.code || exception?.error?.code || HttpStatus.INTERNAL_SERVER_ERROR
        message = exception?.error || exception?.error?.message?.error || 'RpcException'
        break
      default:
        this.logger.error('Its an Unknown Exception')
        if (exception.message === 'Rpc Exception') {
          this.logger.error('RpcException')
          httpStatus = exception?.error?.code || HttpStatus.INTERNAL_SERVER_ERROR
          message = exception?.error?.message?.error || 'Internal server error'
        } else {
          httpStatus =
            exception.response?.status ||
            exception.response?.statusCode ||
            exception.code ||
            exception.statusCode ||
            HttpStatus.INTERNAL_SERVER_ERROR
          message =
            exception.response?.data?.message ||
            exception.response?.message ||
            exception?.message ||
            'Internal server error'
        }

        if (!this.isHttpErrorStatus(httpStatus)) {
          this.logger.error(`httpStatus: ${httpStatus}`)
          httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
        }
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this.logger.error(`Exception Filter : ${message} ${(exception as any)?.stack} ${request.method} ${request.url}`)
    const responseBody = {
      statusCode: httpStatus,
      message,
      error: exception.message,
    }
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
  }

  isHttpErrorStatus(statusCode: number): boolean {
    return Object.values(HttpStatus).includes(statusCode)
  }
}

@Catch(RpcException)
export class CustomExceptionFilter implements RpcExceptionFilter<RpcException> {
  private readonly logger = new Logger('CommonService')

  // Add explicit types for 'exception' and 'host'
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      catch(exception: RpcException, _host: ArgumentsHost): Observable<any> {
    this.logger.error(`CustomExceptionFilter caught error: ${JSON.stringify(exception)}`)
    return throwError(() => new RpcException({ message: exception.getError(), code: HttpStatus.BAD_REQUEST }))
  }
}
