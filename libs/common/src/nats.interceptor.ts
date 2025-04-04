import { ResponseMessages } from '@credebl/common/response-messages';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class NatsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(NatsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        if (error?.message && error?.message.includes(ResponseMessages.nats.error.natsConnect)) {
          this.logger.error(`No subscribers for message: ${error.message}`);
          return throwError(() => new HttpException(ResponseMessages.nats.error.noSubscribers, 500));
        }
        return throwError(() => error);
      })
    );
  }
}
