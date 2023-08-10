import { Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('CommonService');

  catch(exception: HttpException) {
    this.logger.log(
      `ExceptionFilter caught error: ${JSON.stringify(exception)}`
    );

    throw new RpcException(exception);
  }
}
