import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, Inject } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ResponseMessages } from '@credebl/common/response-messages';
import ContextStorageService, { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import { v4 as uuid } from 'uuid';
import { Logger } from '@nestjs/common';

@Injectable()
export class NatsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(NatsInterceptor.name);

  constructor(
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    try {
      const rpcContext = context.switchToRpc().getContext?.() ?? {};
      const headers = rpcContext.getHeaders?.() ?? rpcContext?.headers ?? {};
      this.logger.debug(`headers in NatsInterceptor: ${JSON.stringify(headers.get('contextId'))}`);

      // Support different header shapes and names (compat)
      const correlationId =
        // TODO: Probably change 'x-correlation-id' to 'contextId' only. Coz even if we get 'x-correlation-id' for http requests, we'll probably convert it to 'contextId' afterwards
        headers.get?.('x-correlation-id') ?? headers.get('contextId') ?? uuid();

      // Set CLS ID so logger & rest of code can read it via ContextStorageService
      this.contextStorageService.setContextId(correlationId);
      this.logger.debug(`NATS correlationId set to: ${correlationId}`);
    } catch (err) {
      // Do not throw here — just log and continue
      this.logger.warn(`Failed to extract/set NATS correlationId: ${(err as Error).message}`);
    }

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
