import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import ContextStorageService, { ContextStorageServiceKey } from '../../context/src/contextStorageService.interface';
import Logger, { LoggerKey } from './logger.interface';
import { ClsService } from 'nestjs-cls';
import { v4 } from 'uuid';

const isNullUndefinedOrEmpty = (obj: any): boolean => obj === null || obj === undefined || (typeof obj === 'object' && Object.keys(obj).length === 0);
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly clsService: ClsService,
    @Inject(ContextStorageServiceKey)
    private readonly contextStorageService: ContextStorageService,
    @Inject(LoggerKey) private readonly _logger: Logger,
  ) { }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.clsService.run(() => {

      this._logger.info('In LoggingInterceptor configuration');
      const rpcContext = context.switchToRpc().getContext();
      const headers = rpcContext.getHeaders();

      if (!isNullUndefinedOrEmpty(headers)) {
        this.contextStorageService.set('x-correlation-id', headers._description);
        this.contextStorageService.setContextId(headers._description);
      } else {
        const newContextId = v4();
        this.contextStorageService.set('x-correlation-id', newContextId);
        this.contextStorageService.setContextId(newContextId);
      }

      return next.handle().pipe(
        catchError((err) => {
          this._logger.error(err);
          return throwError(() => err);
        })
      );

    });

  }

}
