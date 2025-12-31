import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import ContextStorageService, { ContextStorageServiceKey } from '@credebl/context/contextStorageService.interface';
import Logger, { LoggerKey } from './logger.interface';
import { ClsService } from 'nestjs-cls';
import { v4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly clsService: ClsService,
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService,
    @Inject(LoggerKey) private readonly logger: Logger
  ) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.clsService.run(() => {
      this.logger.info('In LoggingInterceptor configuration');
      const rpcContext = context.switchToRpc().getContext();
      const headers = rpcContext.getHeaders?.() ?? rpcContext.getHeaders;
      const contextIdFromHeader = headers && 'function' === typeof headers.get ? headers.get('contextId') : undefined;

      if (contextIdFromHeader) {
        this.logger.debug('We found context Id in header of logger Interceptor', contextIdFromHeader);
        this.setupContextId(contextIdFromHeader);
      } else {
        const newContextId = v4();
        this.logger.debug('Not found context Id in header of logger Interceptor, generating a new one:', newContextId);
        this.setupContextId(newContextId);
      }

      return next.handle().pipe(
        catchError((err) => {
          this.logger.error('[intercept] Error in LoggingInterceptor', err);
          return throwError(() => err);
        })
      );
    });
  }

  private setupContextId(contextIdFromHeader: string): void {
    this.contextStorageService.set('x-correlation-id', contextIdFromHeader);
    this.contextStorageService.set('contextId', contextIdFromHeader);
    this.contextStorageService.setContextId(contextIdFromHeader);
  }
}
